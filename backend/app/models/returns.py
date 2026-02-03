import uuid
from app.models import db
from datetime import datetime
from enum import Enum


class ReturnStatus(str, Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    COMPLETED = 'completed'


class Return(db.Model):
    __tablename__ = 'returns'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.String(500), nullable=False)
    status = db.Column(db.Enum(ReturnStatus), default=ReturnStatus.PENDING, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', backref=db.backref('returns', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'user_id': self.user_id,
            'reason': self.reason,
            'status': self.status.value if self.status else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class SupplierPayout(db.Model):
    __tablename__ = 'supplier_payouts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id = db.Column(db.String(36), db.ForeignKey('supplier_profiles.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(50), default='pending', nullable=False)
    reference = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    paid_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    supplier = db.relationship('SupplierProfile', backref=db.backref('payouts', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'supplier_id': self.supplier_id,
            'amount': float(self.amount) if self.amount else 0,
            'status': self.status,
            'reference': self.reference,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        }
