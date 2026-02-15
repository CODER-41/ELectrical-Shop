"""
Automated Delivery Assignment Job

This job runs every 5 minutes to:
1. Find orders in PROCESSING/QUALITY_APPROVED status without delivery assignment
2. Automatically notify available delivery agents
3. Ensure orders don't get stuck waiting for admin

This makes the system fully automated and enterprise-level.
"""

from datetime import datetime, timedelta
from app.models import db
from app.models.order import Order, OrderStatus
from app.models.user import User, DeliveryAgentProfile
from app.models.delivery_request import DeliveryRequest, DeliveryRequestStatus
from app.services.notification_service import notification_service


def auto_notify_delivery_agents():
    """
    Automatically notify delivery agents for orders ready for delivery.
    Runs every 5 minutes via scheduler.
    """
    try:
        print(f"[{datetime.utcnow()}] Running auto-notify delivery agents job...")
        
        # Find orders ready for delivery but not assigned
        orders = Order.query.filter(
            Order.status.in_([OrderStatus.PROCESSING, OrderStatus.QUALITY_APPROVED]),
            Order.assigned_delivery_agent.is_(None),
            Order.payment_status == 'completed'
        ).all()
        
        if not orders:
            print("  No orders pending delivery assignment")
            return
        
        print(f"  Found {len(orders)} orders pending delivery assignment")
        
        notified_count = 0
        
        for order in orders:
            # Check if already notified (has pending delivery requests)
            existing_requests = DeliveryRequest.query.filter_by(
                order_id=order.id,
                status=DeliveryRequestStatus.PENDING
            ).count()
            
            if existing_requests > 0:
                print(f"  Order {order.order_number} already has pending requests, skipping")
                continue
            
            # Find available agents in delivery zone
            agents = DeliveryAgentProfile.query.join(User).filter(
                User.is_active == True,
                DeliveryAgentProfile.is_available == True
            ).all()
            
            # Filter by zone
            zone_agents = []
            for agent in agents:
                if agent.assigned_zones and order.delivery_zone in agent.assigned_zones:
                    zone_agents.append(agent)
            
            # If no zone-specific agents, use all available
            if not zone_agents:
                zone_agents = agents
            
            if not zone_agents:
                print(f"  No available agents for order {order.order_number}")
                continue
            
            # Change status to pending assignment
            order.status = OrderStatus.PENDING_ASSIGNMENT
            
            # Create delivery requests
            expires_at = datetime.utcnow() + timedelta(hours=2)
            
            for agent in zone_agents:
                delivery_request = DeliveryRequest(
                    order_id=order.id,
                    delivery_agent_id=agent.user_id,
                    expires_at=expires_at
                )
                db.session.add(delivery_request)
                
                # Notify agent
                try:
                    notification_service.create_notification(
                        user_id=agent.user_id,
                        title='New Delivery Available',
                        message=f'Order #{order.order_number} to {order.delivery_zone} - KES {order.delivery_fee} delivery fee. Accept within 2 hours.',
                        notification_type='info',
                        link=f'/delivery/available-requests'
                    )
                except Exception as e:
                    print(f"  Failed to notify agent {agent.user_id}: {str(e)}")
            
            db.session.commit()
            notified_count += 1
            print(f"  ✓ Notified {len(zone_agents)} agents for order {order.order_number}")
        
        print(f"  Completed: Notified agents for {notified_count} orders")
        
    except Exception as e:
        db.session.rollback()
        print(f"  ✗ Auto-notify job failed: {str(e)}")
        import traceback
        traceback.print_exc()


def expire_old_delivery_requests():
    """
    Expire delivery requests that have passed their timeout.
    Runs every 10 minutes via scheduler.
    """
    try:
        print(f"[{datetime.utcnow()}] Running expire delivery requests job...")
        
        expired_count = DeliveryRequest.query.filter(
            DeliveryRequest.status == DeliveryRequestStatus.PENDING,
            DeliveryRequest.expires_at <= datetime.utcnow()
        ).update({'status': DeliveryRequestStatus.EXPIRED})
        
        db.session.commit()
        
        if expired_count > 0:
            print(f"  ✓ Expired {expired_count} delivery requests")
            
            # Notify admins about expired requests
            try:
                notification_service.notify_admins(
                    title='Delivery Requests Expired',
                    message=f'{expired_count} delivery requests expired. Manual assignment may be needed.',
                    notification_type='warning',
                    link='/admin/orders?status=pending_assignment'
                )
            except Exception as e:
                print(f"  Failed to notify admins: {str(e)}")
        else:
            print("  No expired requests")
            
    except Exception as e:
        db.session.rollback()
        print(f"  ✗ Expire requests job failed: {str(e)}")


if __name__ == '__main__':
    # For testing
    from app import create_app
    app = create_app()
    
    with app.app_context():
        print("Testing automated delivery assignment...")
        auto_notify_delivery_agents()
        print("\nTesting request expiration...")
        expire_old_delivery_requests()
