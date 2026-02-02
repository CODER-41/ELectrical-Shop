"""
Audit log model for tracking user actions.
"""

from datetime import datetime, timezone
from app.models import db
import uuid


class AuditLog(db.Model):
    """Audit log for tracking important user actions."""
    __tablename__ = 'audit_logs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)  # Nullable for system actions
    action = db.Column(db.String(100), nullable=False)  # e.g., 'product_created', 'order_cancelled'
    entity_type = db.Column(db.String(50), nullable=False)  # e.g., 'product', 'order', 'user'
    entity_id = db.Column(db.String(36), nullable=True)  # ID of the affected entity
    old_values = db.Column(db.JSON, nullable=True)  # Previous values before change
    new_values = db.Column(db.JSON, nullable=True)  # New values after change
    description = db.Column(db.Text, nullable=True)  # Human-readable description
    ip_address = db.Column(db.String(45), nullable=True)  # IPv4 or IPv6
    user_agent = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', backref=db.backref('audit_logs', lazy='dynamic'))

    # Indexes for common queries
    __table_args__ = (
        db.Index('idx_audit_user_id', 'user_id'),
        db.Index('idx_audit_entity', 'entity_type', 'entity_id'),
        db.Index('idx_audit_action', 'action'),
        db.Index('idx_audit_created', 'created_at'),
    )

    # Common action types
    ACTIONS = {
        # User actions
        'user_registered': 'User registered',
        'user_login': 'User logged in',
        'user_logout': 'User logged out',
        'user_updated': 'User profile updated',
        'user_password_changed': 'User password changed',
        'user_activated': 'User account activated',
        'user_deactivated': 'User account deactivated',
        'user_2fa_enabled': 'Two-factor authentication enabled',
        'user_2fa_disabled': 'Two-factor authentication disabled',

        # Product actions
        'product_created': 'Product created',
        'product_updated': 'Product updated',
        'product_deleted': 'Product deleted',
        'product_activated': 'Product activated',
        'product_deactivated': 'Product deactivated',
        'product_stock_updated': 'Product stock updated',

        # Order actions
        'order_created': 'Order created',
        'order_paid': 'Order payment completed',
        'order_status_changed': 'Order status changed',
        'order_cancelled': 'Order cancelled',
        'order_shipped': 'Order shipped',
        'order_delivered': 'Order delivered',

        # Return actions
        'return_requested': 'Return requested',
        'return_approved': 'Return approved',
        'return_rejected': 'Return rejected',
        'return_refunded': 'Return refunded',

        # Supplier actions
        'supplier_approved': 'Supplier approved',
        'supplier_suspended': 'Supplier suspended',
        'payout_processed': 'Supplier payout processed',

        # Admin actions
        'admin_user_created': 'Admin user created',
        'category_created': 'Category created',
        'brand_created': 'Brand created',
        'delivery_zone_created': 'Delivery zone created',
        'settings_updated': 'System settings updated',
    }

    def to_dict(self):
        """Convert audit log to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_email': self.user.email if self.user else None,
            'action': self.action,
            'action_display': self.ACTIONS.get(self.action, self.action),
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'description': self.description,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @classmethod
    def log(cls, action, entity_type, entity_id=None, user_id=None,
            old_values=None, new_values=None, description=None,
            ip_address=None, user_agent=None):
        """
        Create an audit log entry.

        Args:
            action: Action type (e.g., 'product_created')
            entity_type: Type of entity (e.g., 'product')
            entity_id: ID of the affected entity
            user_id: ID of the user performing the action
            old_values: Previous values (dict)
            new_values: New values (dict)
            description: Human-readable description
            ip_address: IP address of the request
            user_agent: User agent string

        Returns:
            AuditLog: The created audit log entry
        """
        log_entry = cls(
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

        db.session.add(log_entry)
        # Don't commit here - let the caller handle the transaction
        return log_entry

    def __repr__(self):
        return f'<AuditLog {self.id} - {self.action} on {self.entity_type}>'
