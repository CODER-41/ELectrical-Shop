import uuid
from datetime import datetime
from enum import Enum
from app.models import db


class NotificationType(str, Enum):
    """Notification type enumeration."""
    ORDER_UPDATE = 'order_update'
    PAYMENT = 'payment'
    PAYOUT = 'payout'
    RETURN = 'return'
    WARRANTY_REMINDER = 'warranty_reminder'
    SYSTEM = 'system'


class Notification(db.Model):
    """Notification model for user notifications."""
    
    __tablename__ = 'notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.Enum(NotificationType), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    action_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Convert notification to dictionary."""
        return {
            'id': self.id,
            'type': self.type.value,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'action_url': self.action_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Notification {self.title} for User {self.user_id}>'
