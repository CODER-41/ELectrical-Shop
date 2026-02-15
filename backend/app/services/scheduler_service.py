"""
Automated Scheduler Service for Electronics Shop.
Handles automatic payment processing, order confirmations, and payouts.
"""

from datetime import datetime, timedelta
from flask import current_app
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger


scheduler = BackgroundScheduler()


def process_auto_confirmations():
    """
    Auto-confirm deliveries after 24-hour timeout.
    Runs every hour to check for expired deadlines.
    """
    from app import create_app
    from app.models import db
    from app.models.order import Order

    app = create_app()
    with app.app_context():
        try:
            # Find orders ready for auto-confirmation
            orders = Order.query.filter(
                Order.delivery_confirmed_by_agent == True,
                Order.customer_confirmed_delivery == False,
                Order.customer_dispute == False,
                Order.auto_confirmed == False,
                Order.auto_confirm_deadline <= datetime.utcnow()
            ).all()

            confirmed_count = 0
            for order in orders:
                if order.auto_confirm_delivery():
                    confirmed_count += 1

            if confirmed_count > 0:
                db.session.commit()
                current_app.logger.info(f'Scheduler: Auto-confirmed {confirmed_count} orders')

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f'Scheduler: Auto-confirm error - {str(e)}')


def generate_and_process_delivery_payouts():
    """
    Generate delivery payouts and process M-Pesa payments.
    Runs daily at 12:00 AM (midnight).
    """
    from app import create_app
    from app.models import db
    from app.models.user import User, DeliveryAgentProfile
    from app.models.order import Order
    from app.models.returns import DeliveryPayout, DeliveryPayoutType
    from app.services.mpesa_service import mpesa_service

    app = create_app()
    with app.app_context():
        try:
            # Step 1: Find confirmed orders with unpaid delivery fees
            orders = Order.query.filter(
                db.or_(
                    Order.customer_confirmed_delivery == True,
                    Order.auto_confirmed == True
                ),
                Order.delivery_fee_paid == False,
                Order.assigned_delivery_agent.isnot(None)
            ).all()

            if not orders:
                current_app.logger.info('Scheduler: No delivery payouts to process')
                return

            # Step 2: Group orders by delivery agent
            agent_orders = {}
            for order in orders:
                agent_id = order.assigned_delivery_agent
                if agent_id not in agent_orders:
                    agent_orders[agent_id] = []
                agent_orders[agent_id].append(order)

            payouts_created = 0
            payments_initiated = 0

            for agent_id, orders_list in agent_orders.items():
                user = User.query.get(agent_id)
                if not user or not user.delivery_agent_profile:
                    continue

                profile = user.delivery_agent_profile

                # Calculate totals
                gross_amount = sum(float(o.delivery_fee) for o in orders_list)
                fee_percentage = float(profile.delivery_fee_percentage) / 100
                net_amount = gross_amount * fee_percentage
                platform_fee = gross_amount - net_amount

                # Skip small amounts (less than 100 KES)
                if net_amount < 100:
                    current_app.logger.info(f'Scheduler: Skipping payout for {profile.first_name} - amount too small ({net_amount})')
                    continue

                # Create payout
                payout = DeliveryPayout(
                    payout_type=DeliveryPayoutType.AGENT,
                    delivery_agent_id=profile.id,
                    gross_amount=gross_amount,
                    platform_fee=platform_fee,
                    net_amount=net_amount,
                    order_count=len(orders_list),
                    order_ids=[o.id for o in orders_list],
                    mpesa_number=profile.mpesa_number,
                    period_start=min(o.delivery_confirmed_at for o in orders_list if o.delivery_confirmed_at),
                    period_end=max(o.delivery_confirmed_at for o in orders_list if o.delivery_confirmed_at)
                )
                payout.generate_payout_number()
                db.session.add(payout)
                db.session.flush()  # Get the payout ID
                payouts_created += 1

                # Step 3: Process M-Pesa payment if number is configured
                if profile.mpesa_number:
                    is_valid, formatted = mpesa_service.validate_phone_number(profile.mpesa_number)
                    if is_valid:
                        payout.status = 'processing'
                        db.session.commit()

                        response = mpesa_service.b2c_payment(
                            phone_number=formatted,
                            amount=float(net_amount),
                            remarks=f'Delivery Payout {payout.payout_number}',
                            occasion='Auto Delivery Payment'
                        )

                        if response.get('success'):
                            payout.payment_reference = response.get('conversation_id')
                            payout.status = 'completed'
                            payout.processed_at = datetime.utcnow()
                            payout.notes = f"Auto-processed via scheduler. ConversationID: {response.get('conversation_id')}"

                            # Mark orders as paid
                            for order in orders_list:
                                order.delivery_fee_paid = True
                                order.delivery_fee_paid_at = datetime.utcnow()
                                order.delivery_payment_reference = response.get('conversation_id')

                            # Update agent stats
                            profile.total_earnings += float(net_amount)
                            profile.pending_payout = 0

                            payments_initiated += 1
                        else:
                            payout.status = 'pending'
                            payout.notes = f"Auto-payment failed: {response.get('error', 'Unknown')}"
                            profile.pending_payout += float(net_amount)

            db.session.commit()
            current_app.logger.info(
                f'Scheduler: Created {payouts_created} delivery payouts, '
                f'initiated {payments_initiated} M-Pesa payments'
            )

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f'Scheduler: Delivery payout error - {str(e)}')


def generate_and_process_supplier_payouts():
    """
    Generate supplier payouts and process M-Pesa payments.
    Runs weekly on Monday at 7 AM.
    """
    from app import create_app
    from app.models import db
    from app.models.user import SupplierProfile
    from app.models.order import Order, OrderItem, OrderStatus
    from app.models.returns import SupplierPayout
    from app.services.mpesa_service import mpesa_service

    app = create_app()
    with app.app_context():
        try:
            # Find suppliers with outstanding balances
            suppliers = SupplierProfile.query.filter(
                SupplierProfile.outstanding_balance > 100,  # Minimum 100 KES
                SupplierProfile.mpesa_number.isnot(None),
                SupplierProfile.is_approved == True
            ).all()

            if not suppliers:
                current_app.logger.info('Scheduler: No supplier payouts to process')
                return

            payouts_processed = 0

            for supplier in suppliers:
                # Check if there's already a pending/processing payout
                existing_payout = SupplierPayout.query.filter(
                    SupplierPayout.supplier_id == supplier.id,
                    SupplierPayout.status.in_(['pending', 'processing'])
                ).first()

                if existing_payout:
                    continue

                amount = float(supplier.outstanding_balance)
                if amount < 100:
                    continue

                # Create payout record
                payout = SupplierPayout(
                    supplier_id=supplier.id,
                    amount=amount,
                    status='processing'
                )
                db.session.add(payout)
                db.session.flush()

                # Process M-Pesa payment
                is_valid, formatted = mpesa_service.validate_phone_number(supplier.mpesa_number)
                if is_valid:
                    response = mpesa_service.b2c_payment(
                        phone_number=formatted,
                        amount=amount,
                        remarks=f'Supplier Payout - {supplier.business_name}',
                        occasion='Auto Supplier Payment'
                    )

                    if response.get('success'):
                        payout.status = 'completed'
                        payout.reference = response.get('conversation_id')
                        payout.paid_at = datetime.utcnow()
                        payout.notes = f"Auto-processed. ConversationID: {response.get('conversation_id')}"

                        # Update supplier balances
                        supplier.total_sales += amount  # Add to total sales (lifetime earnings)
                        supplier.outstanding_balance = 0  # Clear pending balance

                        payouts_processed += 1
                    else:
                        payout.status = 'pending'
                        payout.notes = f"Auto-payment failed: {response.get('error', 'Unknown')}"
                else:
                    payout.status = 'pending'
                    payout.notes = f"Invalid M-Pesa number: {formatted}"

            db.session.commit()
            current_app.logger.info(f'Scheduler: Processed {payouts_processed} supplier payouts')

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f'Scheduler: Supplier payout error - {str(e)}')


def init_scheduler(app):
    """Initialize and start the scheduler with all jobs."""

    if scheduler.running:
        return

    # Add jobs
    # 1. Auto-confirm deliveries - runs every hour
    scheduler.add_job(
        func=process_auto_confirmations,
        trigger=IntervalTrigger(hours=1),
        id='auto_confirm_deliveries',
        name='Auto-confirm deliveries after 24h',
        replace_existing=True
    )

    # 2. Process delivery payouts - runs daily at 12:00 AM (midnight)
    scheduler.add_job(
        func=generate_and_process_delivery_payouts,
        trigger=CronTrigger(hour=0, minute=0),
        id='delivery_payouts',
        name='Generate and process delivery payouts (daily at midnight)',
        replace_existing=True
    )

    # 3. Process supplier payouts - runs weekly on Monday at 7 AM
    scheduler.add_job(
        func=generate_and_process_supplier_payouts,
        trigger=CronTrigger(day_of_week='mon', hour=7, minute=0),
        id='supplier_payouts',
        name='Generate and process supplier payouts (weekly)',
        replace_existing=True
    )
    
    # 4. Auto-notify delivery agents - runs every 5 minutes
    from app.jobs.delivery_assignment import auto_notify_delivery_agents, expire_old_delivery_requests
    
    scheduler.add_job(
        func=auto_notify_delivery_agents,
        trigger=IntervalTrigger(minutes=5),
        id='auto_notify_agents',
        name='Auto-notify delivery agents for ready orders (every 5 min)',
        replace_existing=True
    )
    
    # 5. Expire old delivery requests - runs every 10 minutes
    scheduler.add_job(
        func=expire_old_delivery_requests,
        trigger=IntervalTrigger(minutes=10),
        id='expire_delivery_requests',
        name='Expire old delivery requests (every 10 min)',
        replace_existing=True
    )

    # Start scheduler
    scheduler.start()
    app.logger.info('Scheduler started with automatic payment processing')


def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
