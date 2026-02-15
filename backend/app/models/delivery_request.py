import uuid
from datetime import datetime
from enum import Enum
from app.models import db


class DeliveryRequestStatus(str, Enum):
    """Delivery request status enumeration."""
    PENDING = 'pending'  # Notified to agents, awaiting response
    ACCEPTED = 'accepted'  # Agent accepted the delivery
    REJECTED = 'rejected'  # Agent rejected the delivery
    EXPIRED = 'expired'  # No agent accepted within timeout
    CANCELLED = 'cancelled'  # Order cancelled before assignment


class DeliveryRequest(db.Model):
    """Delivery request model - tracks delivery assignment offers to agents."""
    
    __tablename__ = 'delivery_requests'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False, index=True)
    delivery_agent_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    status = db.Column(db.Enum(DeliveryRequestStatus), default=DeliveryRequestStatus.PENDING, nullable=False, index=True)
    
    # Response tracking
    responded_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Timeout
    expires_at = db.Column(db.DateTime, nullable=False)  # Auto-expire if no response
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    order = db.relationship('Order', backref='delivery_requests', lazy='select')
    delivery_agent = db.relationship('User', foreign_keys=[delivery_agent_id], lazy='select')
    
    def accept(self):
        """Agent accepts the delivery request."""
        if self.status == DeliveryRequestStatus.PENDING:
            self.status = DeliveryRequestStatus.ACCEPTED
            self.responded_at = datetime.utcnow()
            return True
        return False
    
    def reject(self, reason=None):
        """Agent rejects the delivery request."""
        if self.status == DeliveryRequestStatus.PENDING:
            self.status = DeliveryRequestStatus.REJECTED
            self.responded_at = datetime.utcnow()
            self.rejection_reason = reason
            return True
        return False
    
    def is_expired(self):
        """Check if request has expired."""
        return datetime.utcnow() >= self.expires_at and self.status == DeliveryRequestStatus.PENDING
    
    def to_dict(self):
        """Convert delivery request to dictionary."""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'delivery_agent_id': self.delivery_agent_id,
            'status': self.status.value,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'rejection_reason': self.rejection_reason,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_expired': self.is_expired(),
        }
    
    def __repr__(self):
        return f'<DeliveryRequest {self.id} - {self.status.value}>'
