"""
Notification service for creating in-app notifications.
"""

from datetime import datetime, timezone
from flask import current_app
from app.models import db
from app.models.notification import Notification, NotificationType


class NotificationService:
    """Service for creating and managing notifications."""

    @staticmethod
    def create_notification(user_id, notification_type, title, message, action_url=None):
        """
        Create a notification for a user.

        Args:
            user_id: The user to notify
            notification_type: NotificationType enum value
            title: Notification title
            message: Notification message
            action_url: Optional URL for action

        Returns:
            Notification: The created notification
        """
        try:
            notification = Notification(
                user_id=user_id,
                type=notification_type,
                title=title,
                message=message,
                action_url=action_url
            )
            db.session.add(notification)
            # Don't commit here - let the caller handle transaction
            return notification
        except Exception as e:
            current_app.logger.error(f'Failed to create notification: {str(e)}')
            return None

    # Order Notifications
    @staticmethod
    def notify_order_placed(order):
        """Notify customer that order was placed."""
        return NotificationService.create_notification(
            user_id=order.customer.user_id,
            notification_type=NotificationType.ORDER_UPDATE,
            title='Order Placed',
            message=f'Your order {order.order_number} has been placed successfully.',
            action_url=f'/orders/{order.id}'
        )

    @staticmethod
    def notify_order_paid(order):
        """Notify customer that payment was confirmed."""
        return NotificationService.create_notification(
            user_id=order.customer.user_id,
            notification_type=NotificationType.PAYMENT,
            title='Payment Confirmed',
            message=f'Payment for order {order.order_number} has been confirmed.',
            action_url=f'/orders/{order.id}'
        )

    @staticmethod
    def notify_order_shipped(order):
        """Notify customer that order was shipped."""
        return NotificationService.create_notification(
            user_id=order.customer.user_id,
            notification_type=NotificationType.ORDER_UPDATE,
            title='Order Shipped',
            message=f'Your order {order.order_number} has been shipped and is on its way.',
            action_url=f'/orders/{order.id}/track'
        )

    @staticmethod
    def notify_order_delivered(order):
        """Notify customer that order was delivered."""
        return NotificationService.create_notification(
            user_id=order.customer.user_id,
            notification_type=NotificationType.ORDER_UPDATE,
            title='Order Delivered',
            message=f'Your order {order.order_number} has been delivered.',
            action_url=f'/orders/{order.id}'
        )

    @staticmethod
    def notify_supplier_new_order(order_item):
        """Notify supplier of a new order for their product."""
        supplier_user_id = order_item.supplier.user_id
        return NotificationService.create_notification(
            user_id=supplier_user_id,
            notification_type=NotificationType.ORDER_UPDATE,
            title='New Order',
            message=f'You have a new order for {order_item.product_name} (Qty: {order_item.quantity}).',
            action_url=f'/supplier/orders/{order_item.order_id}'
        )

    # Return Notifications
    @staticmethod
    def notify_return_requested(return_request):
        """Notify customer that return request was received."""
        return NotificationService.create_notification(
            user_id=return_request.customer_id,
            notification_type=NotificationType.RETURN,
            title='Return Request Received',
            message=f'Your return request {return_request.return_number} has been received and is being reviewed.',
            action_url=f'/returns/{return_request.id}'
        )

    @staticmethod
    def notify_return_approved(return_request):
        """Notify customer that return was approved."""
        return NotificationService.create_notification(
            user_id=return_request.customer_id,
            notification_type=NotificationType.RETURN,
            title='Return Approved',
            message=f'Your return request {return_request.return_number} has been approved.',
            action_url=f'/returns/{return_request.id}'
        )

    @staticmethod
    def notify_return_rejected(return_request, reason=None):
        """Notify customer that return was rejected."""
        message = f'Your return request {return_request.return_number} has been rejected.'
        if reason:
            message += f' Reason: {reason}'
        return NotificationService.create_notification(
            user_id=return_request.customer_id,
            notification_type=NotificationType.RETURN,
            title='Return Rejected',
            message=message,
            action_url=f'/returns/{return_request.id}'
        )

    @staticmethod
    def notify_refund_processed(return_request):
        """Notify customer that refund was processed."""
        return NotificationService.create_notification(
            user_id=return_request.customer_id,
            notification_type=NotificationType.RETURN,
            title='Refund Processed',
            message=f'Your refund of KES {return_request.refund_amount:,.2f} for {return_request.return_number} has been processed.',
            action_url=f'/returns/{return_request.id}'
        )

    @staticmethod
    def notify_supplier_return(return_request):
        """Notify supplier of a return for their product."""
        order_item = return_request.order_item
        if order_item:
            supplier_user_id = order_item.supplier.user_id
            return NotificationService.create_notification(
                user_id=supplier_user_id,
                notification_type=NotificationType.RETURN,
                title='Return Request',
                message=f'A return has been requested for {order_item.product_name}.',
                action_url=f'/supplier/returns/{return_request.id}'
            )
        return None

    # Payout Notifications
    @staticmethod
    def notify_payout_processed(payout):
        """Notify supplier that payout was processed."""
        return NotificationService.create_notification(
            user_id=payout.supplier.user_id,
            notification_type=NotificationType.PAYOUT,
            title='Payout Processed',
            message=f'Your payout of KES {payout.net_amount:,.2f} ({payout.payout_number}) has been processed.',
            action_url=f'/supplier/payouts/{payout.id}'
        )

    @staticmethod
    def notify_payout_pending(payout):
        """Notify supplier of pending payout."""
        return NotificationService.create_notification(
            user_id=payout.supplier.user_id,
            notification_type=NotificationType.PAYOUT,
            title='Payout Scheduled',
            message=f'A payout of KES {payout.net_amount:,.2f} has been scheduled for processing.',
            action_url=f'/supplier/payouts/{payout.id}'
        )

    # Warranty Notifications
    @staticmethod
    def notify_warranty_expiring(order_item, days_remaining):
        """Notify customer of expiring warranty."""
        customer_user_id = order_item.order.customer.user_id
        return NotificationService.create_notification(
            user_id=customer_user_id,
            notification_type=NotificationType.WARRANTY_REMINDER,
            title='Warranty Expiring Soon',
            message=f'The warranty for {order_item.product_name} expires in {days_remaining} days.',
            action_url=f'/orders/{order_item.order_id}'
        )

    # Supplier Notifications
    @staticmethod
    def notify_supplier_approved(supplier_profile):
        """Notify supplier that account was approved."""
        return NotificationService.create_notification(
            user_id=supplier_profile.user_id,
            notification_type=NotificationType.SYSTEM,
            title='Account Approved',
            message='Congratulations! Your supplier account has been approved. You can now start adding products.',
            action_url='/supplier/products/new'
        )

    @staticmethod
    def notify_supplier_suspended(supplier_profile, reason=None):
        """Notify supplier that account was suspended."""
        message = 'Your supplier account has been suspended.'
        if reason:
            message += f' Reason: {reason}'
        return NotificationService.create_notification(
            user_id=supplier_profile.user_id,
            notification_type=NotificationType.SYSTEM,
            title='Account Suspended',
            message=message,
            action_url='/support'
        )

    @staticmethod
    def notify_low_stock(product):
        """Notify supplier of low stock."""
        return NotificationService.create_notification(
            user_id=product.supplier.user_id,
            notification_type=NotificationType.SYSTEM,
            title='Low Stock Alert',
            message=f'{product.name} is running low on stock ({product.stock_quantity} remaining).',
            action_url=f'/supplier/products/{product.id}'
        )

    # System Notifications
    @staticmethod
    def notify_system_message(user_id, title, message, action_url=None):
        """Send a generic system notification."""
        return NotificationService.create_notification(
            user_id=user_id,
            notification_type=NotificationType.SYSTEM,
            title=title,
            message=message,
            action_url=action_url
        )


# Initialize service instance
notification_service = NotificationService()
