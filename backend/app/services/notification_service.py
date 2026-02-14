"""
Notification service for creating and managing notifications.
"""

from app.models import db
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from flask import request


class NotificationService:
    """Service for creating notifications and audit logs."""

    @staticmethod
    def create_notification(user_id, title, message, notification_type='info', link=None):
        """Create a notification for a user."""
        try:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type,
                link=link
            )
            db.session.add(notification)
            return notification
        except Exception as e:
            print(f"Failed to create notification: {str(e)}")
            return None

    @staticmethod
    def create_audit_log(action, entity_type, entity_id=None, user_id=None,
                        old_values=None, new_values=None, description=None):
        """Create an audit log entry."""
        try:
            ip_address = request.remote_addr if request else None
            user_agent = request.headers.get('User-Agent') if request else None
            
            log = AuditLog.log(
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                user_id=user_id,
                old_values=old_values,
                new_values=new_values,
                description=description,
                ip_address=ip_address,
                user_agent=user_agent
            )
            return log
        except Exception as e:
            print(f"Failed to create audit log: {str(e)}")
            return None

    @staticmethod
    def notify_admins(title, message, notification_type='info', link=None):
        """Send notification to all admin users."""
        from app.models.user import User, UserRole
        try:
            admins = User.query.filter(
                User.role.in_([UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.PRODUCT_MANAGER])
            ).all()
            
            for admin in admins:
                NotificationService.create_notification(
                    user_id=admin.id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    link=link
                )
        except Exception as e:
            print(f"Failed to notify admins: {str(e)}")


notification_service = NotificationService()
