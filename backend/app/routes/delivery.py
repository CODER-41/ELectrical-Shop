"""
Delivery agent routes for managing deliveries and COD collection.
"""

from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, cast, Text
from app.models import db
from app.models.user import User, UserRole, DeliveryAgentProfile
from app.models.order import Order, OrderStatus, PaymentMethod, PaymentStatus, DeliveryZone
from app.models.user import DeliveryCompany
from app.models.returns import DeliveryZoneRequest, ZoneRequestStatus
from app.utils.responses import success_response, error_response
from app.services.email_service import send_email
from app.models.user import CustomerProfile


# =============================================================================
# Auto-Assignment Helper Functions
# =============================================================================

def find_available_agent_for_zone(zone_name):
    """
    Find an available delivery agent assigned to the given zone.
    Returns the agent with the least pending deliveries for load balancing.
    """
    # Find agents assigned to this zone who are available
    agents = DeliveryAgentProfile.query.filter(
        DeliveryAgentProfile.is_available == True,
        DeliveryAgentProfile.assigned_zones.isnot(None),
        cast(DeliveryAgentProfile.assigned_zones, Text).like(f'%{zone_name}%')
    ).all()

    if not agents:
        # Fallback: find any available agent
        agents = DeliveryAgentProfile.query.filter(
            DeliveryAgentProfile.is_available == True
        ).all()

    if not agents:
        return None

    # Find agent with least pending orders (load balancing)
    best_agent = None
    min_orders = float('inf')

    for agent in agents:
        pending_count = Order.query.filter(
            Order.assigned_delivery_agent == agent.user_id,
            Order.status.in_([OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED])
        ).count()

        if pending_count < min_orders:
            min_orders = pending_count
            best_agent = agent

    return best_agent


def auto_assign_delivery_agent(order):
    """
    Automatically assign a delivery agent to an order based on delivery zone.
    Returns True if assignment was successful, False otherwise.
    """
    if order.assigned_delivery_agent:
        return True  # Already assigned

    agent = find_available_agent_for_zone(order.delivery_zone)
    if agent:
        order.assigned_delivery_agent = agent.user_id
        return True

    return False

delivery_bp = Blueprint('delivery', __name__, url_prefix='/api/delivery')


def _send_status_email(order, subject, message):
    """Send order status update email to customer."""
    try:
        customer = CustomerProfile.query.get(order.customer_id)
        if customer and customer.user:
            send_email(
                to_email=customer.user.email,
                subject=f'{subject} - Order #{order.order_number}',
                template='order_status_update',
                context={
                    'customer_name': f'{customer.first_name} {customer.last_name}',
                    'order_number': order.order_number,
                    'status': order.status.value.replace('_', ' ').title(),
                    'message': message,
                    'order_total': f'KES {order.total:,.2f}',
                    'delivery_address': f'{order.delivery_address.address_line_1}, {order.delivery_address.city}' if order.delivery_address else 'N/A'
                }
            )
    except Exception as e:
        current_app.logger.error(f'Failed to send status email: {str(e)}')


def require_delivery_agent(func):
    """Decorator to require delivery agent role."""
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return error_response('User not found', 404)

        if user.role != UserRole.DELIVERY_AGENT:
            return error_response('Delivery agent access required', 403)

        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper


@delivery_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@require_delivery_agent
def get_dashboard():
    """Get delivery agent dashboard with stats."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        profile = user.delivery_agent_profile

        if not profile:
            return error_response('Delivery profile not found', 404)

        # Today's stats
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # Orders assigned to this agent (pending delivery)
        pending_orders = Order.query.filter(
            Order.assigned_delivery_agent == user_id,
            Order.status.in_([OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED])
        ).count()

        # Delivered today
        delivered_today = Order.query.filter(
            Order.assigned_delivery_agent == user_id,
            Order.status == OrderStatus.DELIVERED,
            Order.updated_at >= today_start
        ).count()

        # COD collected today
        cod_today = db.session.query(func.sum(Order.cod_amount_collected)).filter(
            Order.cod_collected_by == user_id,
            Order.cod_collected_at >= today_start
        ).scalar() or 0

        # Total COD pending verification (collected by this agent)
        cod_pending = db.session.query(func.sum(Order.cod_amount_collected)).filter(
            Order.cod_collected_by == user_id,
            Order.cod_verified_at.is_(None),
            Order.cod_collected_at.isnot(None)
        ).scalar() or 0

        return success_response(data={
            'profile': profile.to_dict(),
            'stats': {
                'pending_deliveries': pending_orders,
                'delivered_today': delivered_today,
                'cod_collected_today': float(cod_today),
                'cod_pending_verification': float(cod_pending),
                'total_deliveries': profile.total_deliveries,
                'total_cod_collected': float(profile.total_cod_collected)
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch dashboard: {str(e)}', 500)


@delivery_bp.route('/orders', methods=['GET'])
@jwt_required()
@require_delivery_agent
def get_assigned_orders():
    """Get orders assigned to this delivery agent."""
    try:
        user_id = get_jwt_identity()
        status = request.args.get('status')  # pending, out_for_delivery, delivered
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        query = Order.query.filter(Order.assigned_delivery_agent == user_id)

        if status == 'pending':
            query = query.filter(Order.status.in_([
                OrderStatus.PAID,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED
            ]))
        elif status == 'out_for_delivery':
            query = query.filter(Order.status == OrderStatus.SHIPPED)
        elif status == 'delivered':
            query = query.filter(Order.status == OrderStatus.DELIVERED)

        orders = query.order_by(Order.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'orders': [o.to_dict(include_items=True) for o in orders.items],
            'pagination': {
                'page': orders.page,
                'per_page': orders.per_page,
                'total': orders.total,
                'pages': orders.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch orders: {str(e)}', 500)


@delivery_bp.route('/orders/<order_id>/status', methods=['PUT'])
@jwt_required()
@require_delivery_agent
def update_order_status(order_id):
    """Update order delivery status."""
    try:
        user_id = get_jwt_identity()
        order = Order.query.get(order_id)

        if not order:
            return error_response('Order not found', 404)

        # Verify this order is assigned to this agent
        if order.assigned_delivery_agent != user_id:
            return error_response('This order is not assigned to you', 403)

        data = request.get_json()
        new_status = data.get('status')

        # Delivery agents can only set these statuses
        allowed_statuses = ['shipped', 'out_for_delivery', 'arrived', 'delivered']
        if new_status not in allowed_statuses:
            return error_response(f'Invalid status. Allowed: {allowed_statuses}', 400)

        if new_status == 'shipped':
            order.status = OrderStatus.SHIPPED
            message = 'Order accepted and ready for delivery'
            # Send email notification
            _send_status_email(order, 'Order Accepted', 'Your delivery agent has accepted your order and will start delivery soon.')
        elif new_status == 'out_for_delivery':
            order.status = OrderStatus.OUT_FOR_DELIVERY
            message = 'Order is now out for delivery'
            # Send email notification
            _send_status_email(order, 'Out for Delivery', 'Your order is now out for delivery and on its way to you.')
        elif new_status == 'arrived':
            order.status = OrderStatus.ARRIVED
            message = 'Delivery agent has arrived at destination'
            # Send email notification
            _send_status_email(order, 'Delivery Agent Arrived', 'Your delivery agent has arrived at your location. Please be ready to receive your order.')
        elif new_status == 'delivered':
            order.status = OrderStatus.DELIVERED
            message = 'Order marked as delivered'
            # Send email notification
            _send_status_email(order, 'Order Delivered', 'Your order has been successfully delivered. Thank you for shopping with us!')

            # Update delivery agent stats
            user = User.query.get(user_id)
            if user.delivery_agent_profile:
                user.delivery_agent_profile.total_deliveries += 1

        db.session.commit()

        return success_response(
            data=order.to_dict(),
            message=message
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update status: {str(e)}', 500)


@delivery_bp.route('/orders/<order_id>/collect-cod', methods=['POST'])
@jwt_required()
@require_delivery_agent
def collect_cod(order_id):
    """Record COD collection for an order."""
    try:
        user_id = get_jwt_identity()
        order = Order.query.get(order_id)

        if not order:
            return error_response('Order not found', 404)

        # Verify this order is assigned to this agent
        if order.assigned_delivery_agent != user_id:
            return error_response('This order is not assigned to you', 403)

        if order.payment_method.value != 'cash':
            return error_response('This is not a COD order', 400)

        if order.cod_collected_at:
            return error_response('COD already collected for this order', 400)

        data = request.get_json()
        amount = data.get('amount')

        if not amount:
            return error_response('Amount is required', 400)

        amount = float(amount)
        if amount != float(order.total):
            return error_response(
                f'Amount mismatch. Expected KES {order.total}, got KES {amount}',
                400
            )

        # Record collection
        order.cod_collected_by = user_id
        order.cod_collected_at = datetime.utcnow()
        order.cod_amount_collected = amount
        order.payment_status = 'completed'
        order.paid_at = datetime.utcnow()
        
        # Don't change status if already delivered
        if order.status.value != 'delivered':
            order.status = 'delivered'

        # Update delivery agent stats and earnings
        user = User.query.get(user_id)
        if user.delivery_agent_profile:
            from decimal import Decimal
            delivery_earning = user.delivery_agent_profile.calculate_delivery_earning(order.delivery_fee)
            user.delivery_agent_profile.total_deliveries += 1
            user.delivery_agent_profile.total_cod_collected += Decimal(str(amount))
            user.delivery_agent_profile.pending_payout += Decimal(str(delivery_earning))

        # Update supplier earnings for each order item
        for item in order.items:
            from app.models.user import SupplierProfile
            supplier = SupplierProfile.query.get(item.supplier_id)
            if supplier:
                supplier.outstanding_balance += item.supplier_earnings

        db.session.commit()

        return success_response(
            data=order.to_dict(),
            message=f'COD of KES {amount} collected successfully. Pending admin verification.'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to collect COD: {str(e)}', 500)


@delivery_bp.route('/cod-collections', methods=['GET'])
@jwt_required()
@require_delivery_agent
def get_cod_collections():
    """Get COD collections by this delivery agent."""
    try:
        user_id = get_jwt_identity()
        status = request.args.get('status')  # pending, verified
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        query = Order.query.filter(
            Order.cod_collected_by == user_id,
            Order.cod_collected_at.isnot(None)
        )

        if status == 'pending':
            query = query.filter(Order.cod_verified_at.is_(None))
        elif status == 'verified':
            query = query.filter(Order.cod_verified_at.isnot(None))

        orders = query.order_by(Order.cod_collected_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        # Calculate totals
        total_collected = sum(float(o.cod_amount_collected or 0) for o in orders.items)

        return success_response(data={
            'collections': [
                {
                    'order_id': o.id,
                    'order_number': o.order_number,
                    'amount': float(o.cod_amount_collected),
                    'collected_at': o.cod_collected_at.isoformat(),
                    'verified': o.cod_verified_at is not None,
                    'verified_at': o.cod_verified_at.isoformat() if o.cod_verified_at else None
                }
                for o in orders.items
            ],
            'total_on_page': total_collected,
            'pagination': {
                'page': orders.page,
                'per_page': orders.per_page,
                'total': orders.total,
                'pages': orders.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch collections: {str(e)}', 500)


@delivery_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
@require_delivery_agent
def manage_profile():
    """Get or update delivery agent profile."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    profile = user.delivery_agent_profile

    if not profile:
        return error_response('Profile not found', 404)

    if request.method == 'GET':
        return success_response(data=profile.to_dict())

    # PUT - Update profile
    try:
        data = request.get_json()

        if 'phone_number' in data:
            profile.phone_number = data['phone_number']
        if 'mpesa_number' in data:
            # Validate and normalize phone number
            mpesa_number = data['mpesa_number'].strip()
            if mpesa_number.startswith('+'):
                mpesa_number = mpesa_number[1:]
            if mpesa_number.startswith('0'):
                mpesa_number = '254' + mpesa_number[1:]
            if not mpesa_number.startswith('254'):
                mpesa_number = '254' + mpesa_number
            profile.mpesa_number = mpesa_number
        if 'vehicle_type' in data:
            profile.vehicle_type = data['vehicle_type']
        if 'vehicle_registration' in data:
            profile.vehicle_registration = data['vehicle_registration']
        if 'is_available' in data:
            profile.is_available = data['is_available']

        db.session.commit()

        return success_response(
            data=profile.to_dict(),
            message='Profile updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update profile: {str(e)}', 500)


# =============================================================================
# Admin endpoints for managing delivery agents
# =============================================================================

def require_admin(func):
    """Decorator to require admin role."""
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role not in [UserRole.ADMIN, UserRole.SUPPORT_ADMIN]:
            return error_response('Admin access required', 403)

        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper


@delivery_bp.route('/admin/agents', methods=['GET'])
@jwt_required()
@require_admin
def get_all_delivery_agents():
    """Get all delivery agents (admin only)."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        available_only = request.args.get('available') == 'true'

        query = User.query.filter(User.role == UserRole.DELIVERY_AGENT)

        if available_only:
            query = query.join(DeliveryAgentProfile).filter(
                DeliveryAgentProfile.is_available == True
            )

        users = query.paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'agents': [u.to_dict(include_profile=True) for u in users.items],
            'pagination': {
                'page': users.page,
                'per_page': users.per_page,
                'total': users.total,
                'pages': users.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch agents: {str(e)}', 500)


@delivery_bp.route('/admin/orders/<order_id>/assign', methods=['POST'])
@jwt_required()
@require_admin
def assign_delivery_agent(order_id):
    """Assign a delivery agent to an order (admin only)."""
    try:
        order = Order.query.get(order_id)
        if not order:
            return error_response('Order not found', 404)

        data = request.get_json()
        agent_id = data.get('agent_id')

        if not agent_id:
            return error_response('Agent ID is required', 400)

        # Verify agent exists and is a delivery agent
        agent = User.query.get(agent_id)
        if not agent or agent.role != UserRole.DELIVERY_AGENT:
            return error_response('Invalid delivery agent', 400)

        order.assigned_delivery_agent = agent_id
        db.session.commit()

        return success_response(
            data=order.to_dict(),
            message=f'Order assigned to {agent.delivery_agent_profile.first_name}'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to assign agent: {str(e)}', 500)


@delivery_bp.route('/admin/agents/<agent_id>/stats', methods=['GET'])
@jwt_required()
@require_admin
def get_agent_stats(agent_id):
    """Get detailed stats for a delivery agent (admin only)."""
    try:
        user = User.query.get(agent_id)
        if not user or user.role != UserRole.DELIVERY_AGENT:
            return error_response('Delivery agent not found', 404)

        profile = user.delivery_agent_profile

        # Last 30 days stats
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        deliveries_30d = Order.query.filter(
            Order.assigned_delivery_agent == agent_id,
            Order.status == OrderStatus.DELIVERED,
            Order.updated_at >= thirty_days_ago
        ).count()

        cod_collected_30d = db.session.query(func.sum(Order.cod_amount_collected)).filter(
            Order.cod_collected_by == agent_id,
            Order.cod_collected_at >= thirty_days_ago
        ).scalar() or 0

        # Pending COD verification
        cod_pending = db.session.query(func.sum(Order.cod_amount_collected)).filter(
            Order.cod_collected_by == agent_id,
            Order.cod_verified_at.is_(None),
            Order.cod_collected_at.isnot(None)
        ).scalar() or 0

        return success_response(data={
            'agent': user.to_dict(include_profile=True),
            'stats': {
                'total_deliveries': profile.total_deliveries,
                'total_cod_collected': float(profile.total_cod_collected),
                'deliveries_last_30_days': deliveries_30d,
                'cod_collected_last_30_days': float(cod_collected_30d),
                'cod_pending_verification': float(cod_pending)
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch stats: {str(e)}', 500)


# =============================================================================
# Delivery Confirmation Workflow
# =============================================================================

@delivery_bp.route('/orders/<order_id>/confirm-delivery', methods=['POST'])
@jwt_required()
@require_delivery_agent
def confirm_delivery(order_id):
    """
    Delivery agent confirms order delivery with proof.
    Starts 24-hour window for customer confirmation.
    """
    try:
        user_id = get_jwt_identity()
        order = Order.query.get(order_id)

        if not order:
            return error_response('Order not found', 404)

        if order.assigned_delivery_agent != user_id:
            return error_response('This order is not assigned to you', 403)

        if order.delivery_confirmed_by_agent:
            return error_response('Delivery already confirmed for this order', 400)

        if order.status != OrderStatus.SHIPPED:
            return error_response('Order must be shipped before confirming delivery', 400)

        data = request.get_json() or {}
        proof_photo = data.get('proof_photo')  # URL from photo upload
        recipient_name = data.get('recipient_name')
        notes = data.get('notes')

        # Confirm delivery
        order.confirm_delivery_by_agent(
            proof_photo=proof_photo,
            recipient_name=recipient_name,
            notes=notes
        )

        # Update agent stats
        user = User.query.get(user_id)
        if user.delivery_agent_profile:
            user.delivery_agent_profile.total_deliveries += 1

        db.session.commit()

        return success_response(
            data=order.to_dict(),
            message='Delivery confirmed. Customer has 24 hours to confirm or dispute.'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to confirm delivery: {str(e)}', 500)


@delivery_bp.route('/customer/orders/<order_id>/confirm-receipt', methods=['POST'])
@jwt_required()
def customer_confirm_delivery(order_id):
    """Customer confirms they received the order."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or user.role != UserRole.CUSTOMER:
            return error_response('Customer access required', 403)

        order = Order.query.get(order_id)
        if not order:
            return error_response('Order not found', 404)

        # Verify this is the customer's order
        if not user.customer_profile or order.customer_id != user.customer_profile.id:
            return error_response('This is not your order', 403)

        if not order.delivery_confirmed_by_agent:
            return error_response('Delivery has not been confirmed by the agent yet', 400)

        if order.customer_confirmed_delivery:
            return error_response('You have already confirmed this delivery', 400)

        if order.customer_dispute:
            return error_response('This delivery is under dispute', 400)

        # Confirm receipt
        order.confirm_delivery_by_customer()
        db.session.commit()

        return success_response(
            data=order.to_dict(),
            message='Thank you for confirming receipt of your order!'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to confirm delivery: {str(e)}', 500)


@delivery_bp.route('/customer/orders/<order_id>/dispute', methods=['POST'])
@jwt_required()
def customer_raise_dispute(order_id):
    """Customer raises a dispute about the delivery."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or user.role != UserRole.CUSTOMER:
            return error_response('Customer access required', 403)

        order = Order.query.get(order_id)
        if not order:
            return error_response('Order not found', 404)

        # Verify this is the customer's order
        if not user.customer_profile or order.customer_id != user.customer_profile.id:
            return error_response('This is not your order', 403)

        if not order.delivery_confirmed_by_agent:
            return error_response('Delivery has not been confirmed by the agent yet', 400)

        if order.customer_confirmed_delivery:
            return error_response('You have already confirmed this delivery', 400)

        if order.customer_dispute:
            return error_response('A dispute has already been raised for this order', 400)

        data = request.get_json()
        reason = data.get('reason')

        if not reason or len(reason.strip()) < 10:
            return error_response('Please provide a detailed reason for the dispute (minimum 10 characters)', 400)

        # Raise dispute
        order.raise_delivery_dispute(reason)
        db.session.commit()

        return success_response(
            data=order.to_dict(),
            message='Dispute raised successfully. Our team will review and contact you.'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to raise dispute: {str(e)}', 500)


@delivery_bp.route('/admin/orders/<order_id>/resolve-dispute', methods=['POST'])
@jwt_required()
@require_admin
def resolve_delivery_dispute(order_id):
    """Admin resolves a delivery dispute."""
    try:
        order = Order.query.get(order_id)
        if not order:
            return error_response('Order not found', 404)

        if not order.customer_dispute:
            return error_response('This order has no active dispute', 400)

        data = request.get_json()
        resolution = data.get('resolution')  # 'confirmed', 'refunded', 'redelivery'
        admin_notes = data.get('admin_notes')

        if resolution not in ['confirmed', 'refunded', 'redelivery']:
            return error_response('Invalid resolution. Use: confirmed, refunded, or redelivery', 400)

        if resolution == 'confirmed':
            # Admin confirms delivery despite dispute
            order.customer_dispute = False
            order.customer_confirmed_delivery = True
            order.customer_confirmed_at = datetime.utcnow()
            message = 'Dispute resolved: Delivery confirmed by admin'
        elif resolution == 'refunded':
            # Process refund
            order.status = OrderStatus.RETURNED
            order.payment_status = PaymentStatus.REFUNDED
            message = 'Dispute resolved: Order marked for refund'
        elif resolution == 'redelivery':
            # Schedule redelivery
            order.status = OrderStatus.PROCESSING
            order.delivery_confirmed_by_agent = False
            order.delivery_confirmed_at = None
            order.customer_dispute = False
            order.auto_confirm_deadline = None
            message = 'Dispute resolved: Order scheduled for redelivery'

        order.admin_notes = admin_notes
        db.session.commit()

        return success_response(
            data=order.to_dict(),
            message=message
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to resolve dispute: {str(e)}', 500)


@delivery_bp.route('/admin/process-auto-confirmations', methods=['POST'])
@jwt_required()
@require_admin
def process_auto_confirmations():
    """
    Process auto-confirmations for orders past the 24-hour deadline.
    This should be called periodically (e.g., via cron job).
    """
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

        db.session.commit()

        return success_response(
            data={'confirmed_count': confirmed_count},
            message=f'Auto-confirmed {confirmed_count} orders'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to process auto-confirmations: {str(e)}', 500)


@delivery_bp.route('/admin/pending-confirmations', methods=['GET'])
@jwt_required()
@require_admin
def get_pending_confirmations():
    """Get orders pending customer confirmation."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        orders = Order.query.filter(
            Order.delivery_confirmed_by_agent == True,
            Order.customer_confirmed_delivery == False,
            Order.customer_dispute == False
        ).order_by(Order.auto_confirm_deadline.asc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'orders': [o.to_dict() for o in orders.items],
            'pagination': {
                'page': orders.page,
                'per_page': orders.per_page,
                'total': orders.total,
                'pages': orders.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch pending confirmations: {str(e)}', 500)


@delivery_bp.route('/admin/disputed-orders', methods=['GET'])
@jwt_required()
@require_admin
def get_disputed_orders():
    """Get orders with delivery disputes."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        orders = Order.query.filter(
            Order.customer_dispute == True
        ).order_by(Order.updated_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'orders': [o.to_dict() for o in orders.items],
            'pagination': {
                'page': orders.page,
                'per_page': orders.per_page,
                'total': orders.total,
                'pages': orders.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch disputed orders: {str(e)}', 500)


# =============================================================================
# Delivery Partner Payment Management
# =============================================================================

@delivery_bp.route('/admin/delivery-payouts', methods=['GET'])
@jwt_required()
@require_admin
def get_delivery_payouts():
    """Get all delivery payouts (admin only)."""
    from app.models.returns import DeliveryPayout

    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        status = request.args.get('status')  # pending, processing, completed
        payout_type = request.args.get('type')  # agent, company

        query = DeliveryPayout.query

        if status:
            query = query.filter(DeliveryPayout.status == status)
        if payout_type:
            from app.models.returns import DeliveryPayoutType
            if payout_type == 'agent':
                query = query.filter(DeliveryPayout.payout_type == DeliveryPayoutType.AGENT)
            elif payout_type == 'company':
                query = query.filter(DeliveryPayout.payout_type == DeliveryPayoutType.COMPANY)

        payouts = query.order_by(DeliveryPayout.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'payouts': [p.to_dict() for p in payouts.items],
            'pagination': {
                'page': payouts.page,
                'per_page': payouts.per_page,
                'total': payouts.total,
                'pages': payouts.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch payouts: {str(e)}', 500)


@delivery_bp.route('/admin/generate-delivery-payouts', methods=['POST'])
@jwt_required()
@require_admin
def generate_delivery_payouts():
    """
    Generate payouts for confirmed deliveries that haven't been paid yet.
    This creates payout records for each delivery agent/company with pending earnings.
    """
    from app.models.returns import DeliveryPayout, DeliveryPayoutType

    try:
        user_id = get_jwt_identity()

        # Find all confirmed orders with unpaid delivery fees
        orders = Order.query.filter(
            db.or_(
                Order.customer_confirmed_delivery == True,
                Order.auto_confirmed == True
            ),
            Order.delivery_fee_paid == False,
            Order.assigned_delivery_agent.isnot(None)
        ).all()

        # Group orders by delivery agent
        agent_orders = {}
        for order in orders:
            agent_id = order.assigned_delivery_agent
            if agent_id not in agent_orders:
                agent_orders[agent_id] = []
            agent_orders[agent_id].append(order)

        payouts_created = []

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

            # Update agent's pending payout
            profile.pending_payout += net_amount

            payouts_created.append(payout.payout_number)

        db.session.commit()

        return success_response(
            data={'payouts_created': payouts_created, 'count': len(payouts_created)},
            message=f'Generated {len(payouts_created)} delivery payouts'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to generate payouts: {str(e)}', 500)


@delivery_bp.route('/admin/delivery-payouts/<payout_id>/mpesa', methods=['POST'])
@jwt_required()
@require_admin
def process_delivery_payout_mpesa(payout_id):
    """Process a delivery payout via M-Pesa B2C."""
    from app.models.returns import DeliveryPayout, DeliveryPayoutType
    from app.services.mpesa_service import mpesa_service

    try:
        user_id = get_jwt_identity()
        payout = DeliveryPayout.query.get(payout_id)

        if not payout:
            return error_response('Payout not found', 404)

        if payout.status == 'completed':
            return error_response('Payout already completed', 400)

        if payout.status == 'processing':
            return error_response('Payout is already being processed', 400)

        # Get recipient phone number
        phone_number = payout.mpesa_number
        if not phone_number:
            if payout.payout_type == DeliveryPayoutType.AGENT and payout.delivery_agent:
                phone_number = payout.delivery_agent.mpesa_number
            elif payout.payout_type == DeliveryPayoutType.COMPANY and payout.delivery_company:
                phone_number = payout.delivery_company.contact_phone

        if not phone_number:
            return error_response('No M-Pesa number configured for recipient', 400)

        # Validate phone
        is_valid, result = mpesa_service.validate_phone_number(phone_number)
        if not is_valid:
            return error_response(f'Invalid M-Pesa number: {result}', 400)

        # Mark as processing
        payout.status = 'processing'
        db.session.commit()

        # Initiate B2C payment
        recipient_name = ''
        if payout.payout_type == DeliveryPayoutType.AGENT and payout.delivery_agent:
            recipient_name = f"{payout.delivery_agent.first_name} {payout.delivery_agent.last_name}"
        elif payout.payout_type == DeliveryPayoutType.COMPANY and payout.delivery_company:
            recipient_name = payout.delivery_company.name

        response = mpesa_service.b2c_payment(
            phone_number=phone_number,
            amount=float(payout.net_amount),
            remarks=f'Delivery Payout {payout.payout_number} - {recipient_name}',
            occasion=f'Delivery Payment'
        )

        if response.get('success'):
            payout.payment_reference = response.get('conversation_id')
            payout.notes = f"M-Pesa B2C initiated. ConversationID: {response.get('conversation_id')}"
            db.session.commit()

            return success_response(
                data={
                    'payout': payout.to_dict(),
                    'mpesa_response': response
                },
                message='M-Pesa payout initiated successfully'
            )
        else:
            payout.status = 'pending'
            payout.notes = f"M-Pesa B2C failed: {response.get('error', 'Unknown error')}"
            db.session.commit()

            return error_response(
                f"M-Pesa payout failed: {response.get('error', 'Unknown error')}",
                400
            )

    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to process M-Pesa payout: {str(e)}', 500)


@delivery_bp.route('/admin/delivery-payouts/<payout_id>/complete', methods=['POST'])
@jwt_required()
@require_admin
def complete_delivery_payout(payout_id):
    """Mark a delivery payout as completed and update related orders."""
    from app.models.returns import DeliveryPayout, DeliveryPayoutType

    try:
        user_id = get_jwt_identity()
        payout = DeliveryPayout.query.get(payout_id)

        if not payout:
            return error_response('Payout not found', 404)

        if payout.status == 'completed':
            return error_response('Payout already completed', 400)

        data = request.get_json() or {}
        payment_reference = data.get('payment_reference', payout.payment_reference)

        # Mark payout as completed
        payout.status = 'completed'
        payout.processed_at = datetime.utcnow()
        payout.processed_by = user_id
        payout.payment_reference = payment_reference

        # Mark orders as paid
        if payout.order_ids:
            for order_id in payout.order_ids:
                order = Order.query.get(order_id)
                if order:
                    order.delivery_fee_paid = True
                    order.delivery_fee_paid_at = datetime.utcnow()
                    order.delivery_payment_reference = payment_reference

        # Update delivery partner stats
        if payout.payout_type == DeliveryPayoutType.AGENT and payout.delivery_agent:
            payout.delivery_agent.total_earnings += float(payout.net_amount)
            payout.delivery_agent.pending_payout -= float(payout.net_amount)
        elif payout.payout_type == DeliveryPayoutType.COMPANY and payout.delivery_company:
            payout.delivery_company.total_paid += float(payout.net_amount)
            payout.delivery_company.pending_balance -= float(payout.net_amount)

        db.session.commit()

        return success_response(
            data=payout.to_dict(),
            message='Delivery payout completed successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to complete payout: {str(e)}', 500)


@delivery_bp.route('/agent/payouts', methods=['GET'])
@jwt_required()
@require_delivery_agent
def get_agent_payouts():
    """Get payouts for the current delivery agent."""
    from app.models.returns import DeliveryPayout, DeliveryPayoutType

    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        profile = user.delivery_agent_profile

        if not profile:
            return error_response('Profile not found', 404)

        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        status = request.args.get('status')

        query = DeliveryPayout.query.filter(
            DeliveryPayout.payout_type == DeliveryPayoutType.AGENT,
            DeliveryPayout.delivery_agent_id == profile.id
        )

        if status:
            query = query.filter(DeliveryPayout.status == status)

        payouts = query.order_by(DeliveryPayout.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        # Calculate totals
        total_earned = float(profile.total_earnings)
        pending_payout = float(profile.pending_payout)

        return success_response(data={
            'payouts': [p.to_dict() for p in payouts.items],
            'summary': {
                'total_earned': total_earned,
                'pending_payout': pending_payout,
                'mpesa_number': profile.mpesa_number,
                'fee_percentage': float(profile.delivery_fee_percentage)
            },
            'pagination': {
                'page': payouts.page,
                'per_page': payouts.per_page,
                'total': payouts.total,
                'pages': payouts.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch payouts: {str(e)}', 500)


@delivery_bp.route('/agent/update-mpesa', methods=['PUT'])
@jwt_required()
@require_delivery_agent
def update_agent_mpesa_number():
    """Update delivery agent's M-Pesa number for payments."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        profile = user.delivery_agent_profile

        if not profile:
            return error_response('Profile not found', 404)

        data = request.get_json()
        mpesa_number = data.get('mpesa_number')

        if not mpesa_number:
            return error_response('M-Pesa number is required', 400)

        # Validate the number
        from app.services.mpesa_service import mpesa_service
        is_valid, result = mpesa_service.validate_phone_number(mpesa_number)
        if not is_valid:
            return error_response(f'Invalid M-Pesa number: {result}', 400)

        profile.mpesa_number = result  # Store formatted number
        db.session.commit()

        return success_response(
            data=profile.to_dict(),
            message='M-Pesa number updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update M-Pesa number: {str(e)}', 500)


@delivery_bp.route('/admin/agents/<agent_id>/pay-now', methods=['POST'])
@jwt_required()
@require_admin
def pay_delivery_agent_now(agent_id):
    """Admin manually pays delivery agent pending balance (emergency payment)."""
    try:
        from app.services.mpesa_service import mpesa_service
        
        profile = DeliveryAgentProfile.query.get(agent_id)
        if not profile:
            return error_response('Delivery agent not found', 404)
            
        if profile.pending_payout <= 0:
            return error_response('No pending payout to pay', 400)
            
        data = request.get_json() or {}
        amount = data.get('amount', float(profile.pending_payout))
        notes = data.get('notes', 'Emergency manual payment')
        
        if amount > float(profile.pending_payout):
            return error_response('Amount exceeds pending payout', 400)
            
        # Initiate M-Pesa payment
        response = mpesa_service.b2c_payment(
            phone_number=profile.mpesa_number,
            amount=amount,
            remarks=f'Delivery Agent Payment - {profile.first_name} {profile.last_name}',
            occasion='Manual Payment'
        )
        
        if response.get('success'):
            # Update agent balance
            from decimal import Decimal
            profile.pending_payout -= Decimal(str(amount))
            profile.total_earnings += Decimal(str(amount))
            
            # Create payment record
            from app.models.returns import DeliveryPayout, DeliveryPayoutType
            payout = DeliveryPayout(
                payout_type=DeliveryPayoutType.AGENT,
                delivery_agent_id=profile.id,
                gross_amount=amount,
                platform_fee=0,
                net_amount=amount,
                order_count=0,
                payment_reference=response.get('conversation_id'),
                status='completed',
                processed_at=datetime.utcnow(),
                processed_by=get_jwt_identity(),
                notes=notes
            )
            payout.generate_payout_number()
            db.session.add(payout)
            db.session.commit()
            
            return success_response(
                data={'agent': profile.to_dict(), 'payout': payout.to_dict()},
                message=f'Payment of KES {amount} sent to {profile.first_name} {profile.last_name}'
            )
        else:
            return error_response(f"Payment failed: {response.get('error')}", 400)
            
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to process payment: {str(e)}', 500)


@delivery_bp.route('/admin/agents/pending-payments', methods=['GET'])
@jwt_required()
@require_admin
def get_agents_pending_payment():
    """Get delivery agents with pending payouts for admin dashboard."""
    try:
        agents = DeliveryAgentProfile.query.filter(
            DeliveryAgentProfile.pending_payout > 0
        ).order_by(DeliveryAgentProfile.pending_payout.desc()).all()
        
        return success_response(data={
            'agents': [{
                'id': a.id,
                'name': f'{a.first_name} {a.last_name}',
                'pending_payout': float(a.pending_payout),
                'mpesa_number': a.mpesa_number,
                'total_earnings': float(a.total_earnings)
            } for a in agents],
            'total_pending': sum(float(a.pending_payout) for a in agents)
        })
    except Exception as e:
        return error_response(f'Failed to fetch pending payments: {str(e)}', 500)


@delivery_bp.route('/admin/suppliers/<supplier_id>/pay-now', methods=['POST'])
@jwt_required()
@require_admin
def pay_supplier_now(supplier_id):
    """Admin manually pays supplier outstanding balance (emergency payment)."""
    try:
        from app.models.user import SupplierProfile
        from app.services.mpesa_service import mpesa_service
        
        supplier = SupplierProfile.query.get(supplier_id)
        if not supplier:
            return error_response('Supplier not found', 404)
            
        if supplier.outstanding_balance <= 0:
            return error_response('No outstanding balance to pay', 400)
            
        data = request.get_json() or {}
        amount = data.get('amount', float(supplier.outstanding_balance))
        notes = data.get('notes', 'Emergency manual payment')
        
        if amount > float(supplier.outstanding_balance):
            return error_response('Amount exceeds outstanding balance', 400)
            
        # Initiate M-Pesa payment
        response = mpesa_service.b2c_payment(
            phone_number=supplier.mpesa_number,
            amount=amount,
            remarks=f'Supplier Payment - {supplier.business_name}',
            occasion='Manual Payment'
        )
        
        if response.get('success'):
            # Update supplier balance
            supplier.outstanding_balance -= amount
            supplier.total_sales += amount
            
            # Create payment record
            from app.models.returns import SupplierPayout
            payout = SupplierPayout(
                supplier_id=supplier.id,
                amount=amount,
                reference=response.get('conversation_id'),
                notes=notes,
                status='completed',
                paid_at=datetime.utcnow()
            )
            db.session.add(payout)
            db.session.commit()
            
            return success_response(
                data={'supplier': supplier.to_dict(), 'payout': payout.to_dict()},
                message=f'Payment of KES {amount} sent to {supplier.business_name}'
            )
        else:
            return error_response(f"Payment failed: {response.get('error')}", 400)
            
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to process payment: {str(e)}', 500)


@delivery_bp.route('/admin/suppliers/pending-payments', methods=['GET'])
@jwt_required()
@require_admin
def get_suppliers_pending_payment():
    """Get suppliers with outstanding balances for admin dashboard."""
    try:
        from app.models.user import SupplierProfile
        
        suppliers = SupplierProfile.query.filter(
            SupplierProfile.outstanding_balance > 0
        ).order_by(SupplierProfile.outstanding_balance.desc()).all()
        
        return success_response(data={
            'suppliers': [{
                'id': s.id,
                'business_name': s.business_name,
                'outstanding_balance': float(s.outstanding_balance),
                'mpesa_number': s.mpesa_number,
                'total_sales': float(s.total_sales)
            } for s in suppliers],
            'total_pending': sum(float(s.outstanding_balance) for s in suppliers)
        })
    except Exception as e:
        return error_response(f'Failed to fetch pending payments: {str(e)}', 500)


# =============================================================================
# Third-Party Delivery Company Management
# =============================================================================

@delivery_bp.route('/admin/companies', methods=['GET'])
@jwt_required()
@require_admin
def get_delivery_companies():
    """Get all delivery companies (admin only)."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        active_only = request.args.get('active') == 'true'

        query = DeliveryCompany.query

        if active_only:
            query = query.filter(DeliveryCompany.is_active == True)

        companies = query.order_by(DeliveryCompany.name)\
            .paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'companies': [c.to_dict() for c in companies.items],
            'pagination': {
                'page': companies.page,
                'per_page': companies.per_page,
                'total': companies.total,
                'pages': companies.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch companies: {str(e)}', 500)


@delivery_bp.route('/admin/companies', methods=['POST'])
@jwt_required()
@require_admin
def create_delivery_company():
    """Create a new delivery company (admin only)."""
    try:
        data = request.get_json()

        required_fields = ['name']
        for field in required_fields:
            if not data.get(field):
                return error_response(f'{field} is required', 400)

        # Check if company already exists
        existing = DeliveryCompany.query.filter_by(name=data['name']).first()
        if existing:
            return error_response('A company with this name already exists', 400)

        company = DeliveryCompany(
            name=data['name'],
            contact_email=data.get('contact_email'),
            contact_phone=data.get('contact_phone'),
            mpesa_paybill=data.get('mpesa_paybill'),
            mpesa_account=data.get('mpesa_account'),
            delivery_fee_percentage=data.get('delivery_fee_percentage', 80.00),
            settlement_period_days=data.get('settlement_period_days', 7),
            minimum_payout_amount=data.get('minimum_payout_amount', 1000.00),
            service_zones=data.get('service_zones'),
            is_active=True
        )
        db.session.add(company)
        db.session.commit()

        return success_response(
            data=company.to_dict(),
            message='Delivery company created successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create company: {str(e)}', 500)


@delivery_bp.route('/admin/companies/<company_id>', methods=['PUT'])
@jwt_required()
@require_admin
def update_delivery_company(company_id):
    """Update a delivery company (admin only)."""
    try:
        company = DeliveryCompany.query.get(company_id)
        if not company:
            return error_response('Company not found', 404)

        data = request.get_json()

        if 'name' in data:
            company.name = data['name']
        if 'contact_email' in data:
            company.contact_email = data['contact_email']
        if 'contact_phone' in data:
            company.contact_phone = data['contact_phone']
        if 'mpesa_paybill' in data:
            company.mpesa_paybill = data['mpesa_paybill']
        if 'mpesa_account' in data:
            company.mpesa_account = data['mpesa_account']
        if 'delivery_fee_percentage' in data:
            company.delivery_fee_percentage = data['delivery_fee_percentage']
        if 'settlement_period_days' in data:
            company.settlement_period_days = data['settlement_period_days']
        if 'minimum_payout_amount' in data:
            company.minimum_payout_amount = data['minimum_payout_amount']
        if 'service_zones' in data:
            company.service_zones = data['service_zones']
        if 'is_active' in data:
            company.is_active = data['is_active']
        if 'api_key' in data:
            company.api_key = data['api_key']
        if 'api_endpoint' in data:
            company.api_endpoint = data['api_endpoint']
        if 'is_api_integrated' in data:
            company.is_api_integrated = data['is_api_integrated']

        db.session.commit()

        return success_response(
            data=company.to_dict(),
            message='Delivery company updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update company: {str(e)}', 500)


@delivery_bp.route('/admin/orders/<order_id>/assign-company', methods=['POST'])
@jwt_required()
@require_admin
def assign_delivery_company(order_id):
    """Assign a third-party delivery company to an order (admin only)."""
    try:
        order = Order.query.get(order_id)
        if not order:
            return error_response('Order not found', 404)

        data = request.get_json()
        company_id = data.get('company_id')

        if not company_id:
            return error_response('Company ID is required', 400)

        company = DeliveryCompany.query.get(company_id)
        if not company:
            return error_response('Delivery company not found', 404)

        if not company.is_active:
            return error_response('This delivery company is not active', 400)

        order.assigned_delivery_company = company_id
        # Clear individual agent assignment if any
        order.assigned_delivery_agent = None
        db.session.commit()

        return success_response(
            data=order.to_dict(),
            message=f'Order assigned to {company.name}'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to assign company: {str(e)}', 500)


# =============================================================================
# Delivery Zone Request Management
# =============================================================================

@delivery_bp.route('/zones', methods=['GET'])
@jwt_required()
@require_delivery_agent
def get_all_zones():
    """Get all delivery zones for agents to see available options."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        profile = user.delivery_agent_profile

        zones = DeliveryZone.query.filter_by(is_active=True).all()

        # Mark which zones the agent is already assigned to
        assigned_zone_names = profile.assigned_zones or []

        zones_data = []
        for zone in zones:
            zone_dict = zone.to_dict()
            zone_dict['is_assigned'] = zone.name in assigned_zone_names
            zones_data.append(zone_dict)

        return success_response(data={
            'zones': zones_data,
            'assigned_zone_names': assigned_zone_names
        })
    except Exception as e:
        return error_response(f'Failed to fetch zones: {str(e)}', 500)


@delivery_bp.route('/zone-requests', methods=['GET'])
@jwt_required()
@require_delivery_agent
def get_my_zone_requests():
    """Get zone requests for the current delivery agent."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        profile = user.delivery_agent_profile

        if not profile:
            return error_response('Profile not found', 404)

        requests = DeliveryZoneRequest.query.filter_by(
            delivery_agent_id=profile.id
        ).order_by(DeliveryZoneRequest.created_at.desc()).all()

        return success_response(data={
            'requests': [r.to_dict() for r in requests]
        })
    except Exception as e:
        return error_response(f'Failed to fetch zone requests: {str(e)}', 500)


@delivery_bp.route('/zone-requests', methods=['POST'])
@jwt_required()
@require_delivery_agent
def request_zone():
    """Request to be assigned to a new delivery zone."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        profile = user.delivery_agent_profile

        if not profile:
            return error_response('Profile not found', 404)

        data = request.get_json()
        zone_id = data.get('zone_id')
        reason = data.get('reason')
        experience = data.get('experience')

        if not zone_id:
            return error_response('Zone ID is required', 400)

        # Check if zone exists
        zone = DeliveryZone.query.get(zone_id)
        if not zone:
            return error_response('Zone not found', 404)

        if not zone.is_active:
            return error_response('This zone is not active', 400)

        # Check if already assigned
        if profile.assigned_zones and zone_id in profile.assigned_zones:
            return error_response('You are already assigned to this zone', 400)

        # Check for existing pending request
        existing = DeliveryZoneRequest.query.filter_by(
            delivery_agent_id=profile.id,
            zone_id=zone_id,
            status=ZoneRequestStatus.PENDING
        ).first()

        if existing:
            return error_response('You already have a pending request for this zone', 400)

        # Create request
        zone_request = DeliveryZoneRequest(
            delivery_agent_id=profile.id,
            zone_id=zone_id,
            reason=reason,
            experience=experience
        )
        db.session.add(zone_request)
        db.session.commit()

        return success_response(
            data=zone_request.to_dict(),
            message='Zone request submitted successfully. Awaiting admin approval.'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to submit zone request: {str(e)}', 500)


@delivery_bp.route('/zone-requests/<request_id>/cancel', methods=['POST'])
@jwt_required()
@require_delivery_agent
def cancel_zone_request(request_id):
    """Cancel a pending zone request."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        profile = user.delivery_agent_profile

        zone_request = DeliveryZoneRequest.query.get(request_id)

        if not zone_request:
            return error_response('Request not found', 404)

        if zone_request.delivery_agent_id != profile.id:
            return error_response('This is not your request', 403)

        if zone_request.status != ZoneRequestStatus.PENDING:
            return error_response('Only pending requests can be cancelled', 400)

        db.session.delete(zone_request)
        db.session.commit()

        return success_response(message='Zone request cancelled')
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to cancel request: {str(e)}', 500)


# =============================================================================
# Admin Zone Request Management
# =============================================================================

@delivery_bp.route('/admin/zone-requests', methods=['GET'])
@jwt_required()
@require_admin
def get_all_zone_requests():
    """Get all zone requests (admin only)."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        status = request.args.get('status')  # pending, approved, rejected

        query = DeliveryZoneRequest.query

        if status:
            if status == 'pending':
                query = query.filter(DeliveryZoneRequest.status == ZoneRequestStatus.PENDING)
            elif status == 'approved':
                query = query.filter(DeliveryZoneRequest.status == ZoneRequestStatus.APPROVED)
            elif status == 'rejected':
                query = query.filter(DeliveryZoneRequest.status == ZoneRequestStatus.REJECTED)

        requests = query.order_by(DeliveryZoneRequest.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'requests': [r.to_dict() for r in requests.items],
            'pagination': {
                'page': requests.page,
                'per_page': requests.per_page,
                'total': requests.total,
                'pages': requests.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch zone requests: {str(e)}', 500)


@delivery_bp.route('/admin/zone-requests/<request_id>/approve', methods=['POST'])
@jwt_required()
@require_admin
def approve_zone_request(request_id):
    """Approve a zone request (admin only)."""
    try:
        user_id = get_jwt_identity()

        zone_request = DeliveryZoneRequest.query.get(request_id)

        if not zone_request:
            return error_response('Request not found', 404)

        if zone_request.status != ZoneRequestStatus.PENDING:
            return error_response('Only pending requests can be approved', 400)

        data = request.get_json() or {}
        notes = data.get('notes')

        zone_request.approve(user_id, notes)
        db.session.commit()

        return success_response(
            data=zone_request.to_dict(),
            message='Zone request approved. Agent has been assigned to the zone.'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to approve request: {str(e)}', 500)


@delivery_bp.route('/admin/zone-requests/<request_id>/reject', methods=['POST'])
@jwt_required()
@require_admin
def reject_zone_request(request_id):
    """Reject a zone request (admin only)."""
    try:
        user_id = get_jwt_identity()

        zone_request = DeliveryZoneRequest.query.get(request_id)

        if not zone_request:
            return error_response('Request not found', 404)

        if zone_request.status != ZoneRequestStatus.PENDING:
            return error_response('Only pending requests can be rejected', 400)

        data = request.get_json() or {}
        notes = data.get('notes')

        if not notes:
            return error_response('Please provide a reason for rejection', 400)

        zone_request.reject(user_id, notes)
        db.session.commit()

        return success_response(
            data=zone_request.to_dict(),
            message='Zone request rejected.'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to reject request: {str(e)}', 500)


@delivery_bp.route('/admin/agents/<agent_id>/zones', methods=['PUT'])
@jwt_required()
@require_admin
def update_agent_zones(agent_id):
    """Directly update an agent's assigned zones (admin only)."""
    try:
        profile = DeliveryAgentProfile.query.get(agent_id)

        if not profile:
            return error_response('Agent not found', 404)

        data = request.get_json()
        zone_ids = data.get('zone_ids', [])

        # Validate all zone IDs
        for zone_id in zone_ids:
            zone = DeliveryZone.query.get(zone_id)
            if not zone:
                return error_response(f'Zone {zone_id} not found', 404)

        profile.assigned_zones = zone_ids
        db.session.commit()

        return success_response(
            data=profile.to_dict(),
            message='Agent zones updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update zones: {str(e)}', 500)


# =============================================================================
# Auto-Assignment Endpoints
# =============================================================================

@delivery_bp.route('/admin/orders/unassigned', methods=['GET'])
@jwt_required()
@require_admin
def get_unassigned_orders():
    """Get orders that need delivery agent assignment."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        payment_method = request.args.get('payment_method')  # mpesa, card, cash

        query = Order.query.filter(
            Order.assigned_delivery_agent.is_(None),
            Order.assigned_delivery_company.is_(None),
            Order.status.in_([OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING])
        )

        if payment_method:
            if payment_method == 'cod':
                query = query.filter(Order.payment_method == PaymentMethod.CASH)
            elif payment_method == 'mpesa':
                query = query.filter(Order.payment_method == PaymentMethod.MPESA)
            elif payment_method == 'card':
                query = query.filter(Order.payment_method == PaymentMethod.CARD)

        orders = query.order_by(Order.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return success_response(data={
            'orders': [o.to_dict(include_items=True) for o in orders.items],
            'pagination': {
                'page': orders.page,
                'per_page': orders.per_page,
                'total': orders.total,
                'pages': orders.pages
            }
        })
    except Exception as e:
        return error_response(f'Failed to fetch unassigned orders: {str(e)}', 500)


@delivery_bp.route('/admin/orders/<order_id>/auto-assign', methods=['POST'])
@jwt_required()
@require_admin
def auto_assign_order(order_id):
    """Auto-assign a delivery agent to an order based on zone."""
    try:
        order = Order.query.get(order_id)

        if not order:
            return error_response('Order not found', 404)

        if order.assigned_delivery_agent:
            return error_response('Order already has an assigned agent', 400)

        success = auto_assign_delivery_agent(order)

        if success:
            db.session.commit()

            agent = User.query.get(order.assigned_delivery_agent)
            agent_name = f"{agent.delivery_agent_profile.first_name} {agent.delivery_agent_profile.last_name}" if agent else "Unknown"

            return success_response(
                data=order.to_dict(),
                message=f'Order auto-assigned to {agent_name}'
            )
        else:
            return error_response('No available delivery agents found for this zone', 400)
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to auto-assign: {str(e)}', 500)


@delivery_bp.route('/admin/orders/auto-assign-all', methods=['POST'])
@jwt_required()
@require_admin
def auto_assign_all_orders():
    """Auto-assign delivery agents to all unassigned orders."""
    try:
        # Get all unassigned orders
        orders = Order.query.filter(
            Order.assigned_delivery_agent.is_(None),
            Order.assigned_delivery_company.is_(None),
            Order.status.in_([OrderStatus.PAID, OrderStatus.PROCESSING])
        ).all()

        assigned_count = 0
        failed_orders = []

        for order in orders:
            if auto_assign_delivery_agent(order):
                assigned_count += 1
            else:
                failed_orders.append({
                    'order_number': order.order_number,
                    'zone': order.delivery_zone,
                    'reason': 'No available agent for zone'
                })

        db.session.commit()

        return success_response(data={
            'assigned_count': assigned_count,
            'total_orders': len(orders),
            'failed_orders': failed_orders
        }, message=f'Auto-assigned {assigned_count} of {len(orders)} orders')
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to auto-assign orders: {str(e)}', 500)


# =============================================================================
# Admin Delivery Dashboard
# =============================================================================

@delivery_bp.route('/admin/dashboard', methods=['GET'])
@jwt_required()
@require_admin
def get_admin_delivery_dashboard():
    """Get delivery management dashboard stats (admin only)."""
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # Total active agents
        total_agents = DeliveryAgentProfile.query.count()
        available_agents = DeliveryAgentProfile.query.filter_by(is_available=True).count()

        # Orders by status
        unassigned_orders = Order.query.filter(
            Order.assigned_delivery_agent.is_(None),
            Order.assigned_delivery_company.is_(None),
            Order.status.in_([OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING])
        ).count()

        pending_delivery = Order.query.filter(
            Order.assigned_delivery_agent.isnot(None),
            Order.status.in_([OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED])
        ).count()

        delivered_today = Order.query.filter(
            Order.status == OrderStatus.DELIVERED,
            Order.updated_at >= today_start
        ).count()

        # COD stats
        cod_pending_verification = db.session.query(func.sum(Order.cod_amount_collected)).filter(
            Order.cod_collected_at.isnot(None),
            Order.cod_verified_at.is_(None)
        ).scalar() or 0

        cod_collected_today = db.session.query(func.sum(Order.cod_amount_collected)).filter(
            Order.cod_collected_at >= today_start
        ).scalar() or 0

        # Zone requests
        pending_zone_requests = DeliveryZoneRequest.query.filter_by(
            status=ZoneRequestStatus.PENDING
        ).count()

        # Disputes
        active_disputes = Order.query.filter_by(customer_dispute=True).count()

        return success_response(data={
            'agents': {
                'total': total_agents,
                'available': available_agents
            },
            'orders': {
                'unassigned': unassigned_orders,
                'pending_delivery': pending_delivery,
                'delivered_today': delivered_today
            },
            'cod': {
                'pending_verification': float(cod_pending_verification),
                'collected_today': float(cod_collected_today)
            },
            'zone_requests_pending': pending_zone_requests,
            'active_disputes': active_disputes
        })
    except Exception as e:
        return error_response(f'Failed to fetch dashboard: {str(e)}', 500)


@delivery_bp.route('/admin/delivery-zones', methods=['GET'])
@jwt_required()
@require_admin
def get_delivery_zones_admin():
    """Get all delivery zones with agent counts (admin only)."""
    try:
        zones = DeliveryZone.query.all()

        zones_data = []
        for zone in zones:
            zone_dict = zone.to_dict()

            # Count agents assigned to this zone (assigned_zones stores zone names)
            agent_count = DeliveryAgentProfile.query.filter(
                DeliveryAgentProfile.assigned_zones.isnot(None),
                cast(DeliveryAgentProfile.assigned_zones, Text).like(f'%{zone.name}%')
            ).count()

            zone_dict['agent_count'] = agent_count
            zones_data.append(zone_dict)

        return success_response(data={'zones': zones_data})
    except Exception as e:
        return error_response(f'Failed to fetch zones: {str(e)}', 500)
