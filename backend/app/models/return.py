import uuid
from datetime import datetime
from enum import Enum
from app.models import db


class ReturnReason(str, Enum):
    """Return reason enumeration."""
    DEFECTIVE = 'defective'
    WRONG_ITEM = 'wrong_item'
    NOT_AS_DESCRIBED = 'not_as_described'
    CHANGED_MIND = 'changed_mind'
    SIZE_ISSUE = 'size_issue'
    QUALITY_ISSUE = 'quality_issue'
    OTHER = 'other'


class ReturnStatus(str, Enum):
    """Return status enumeration."""
    REQUESTED = 'requested'
    PENDING_REVIEW = 'pending_review'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    ITEM_RECEIVED = 'item_received'
    REFUND_PROCESSING = 'refund_processing'
    REFUND_COMPLETED = 'refund_completed'
    CANCELLED = 'cancelled'


class RefundMethod(str, Enum):
    """Refund method enumeration."""
    MPESA = 'mpesa'
    BANK_TRANSFER = 'bank_transfer'
    STORE_CREDIT = 'store_credit'


class Return(db.Model):
    """Return model for product returns and warranty claims."""
    
    __tablename__ = 'returns'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    return_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # References
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False, index=True)
    order_item_id = db.Column(db.String(36), db.ForeignKey('order_items.id'), nullable=False)
    customer_id = db.Column(db.String(36), db.ForeignKey('customer_profiles.id'), nullable=False, index=True)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)
    
    # Return details
    reason = db.Column(db.Enum(ReturnReason), nullable=False)
    description = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    
    # Status
    status = db.Column(db.Enum(ReturnStatus), default=ReturnStatus.REQUESTED, nullable=False, index=True)
    
    # Images (proof of defect/issue)
    images = db.Column(db.JSON, nullable=True)  # Array of image URLs
    
    # Refund details
    refund_amount = db.Column(db.Numeric(12, 2), nullable=True)
    refund_method = db.Column(db.Enum(RefundMethod), nullable=True)
    refund_reference = db.Column(db.String(100), nullable=True)
    refunded_at = db.Column(db.DateTime, nullable=True)
    
    # Admin review
    reviewed_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Warranty claim flag
    is_warranty_claim = db.Column(db.Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    order = db.relationship('Order', backref='returns', lazy=True)
    order_item = db.relationship('OrderItem', backref='returns', lazy=True)
    
    def generate_return_number(self):
        """Generate unique return number."""
        # Format: RET-YYYYMMDD-XXXX
        date_str = datetime.utcnow().strftime('%Y%m%d')
        
        # Count returns today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        count = Return.query.filter(Return.created_at >= today_start).count() + 1
        
        self.return_number = f'RET-{date_str}-{count:04d}'
    
    def to_dict(self, include_order=True):
        """Convert return to dictionary."""
        data = {
            'id': self.id,
            'return_number': self.return_number,
            'order_id': self.order_id,
            'order_item_id': self.order_item_id,
            'customer_id': self.customer_id,
            'product_id': self.product_id,
            'reason': self.reason.value,
            'description': self.description,
            'quantity': self.quantity,
            'status': self.status.value,
            'images': self.images,
            'refund_amount': float(self.refund_amount) if self.refund_amount else None,
            'refund_method': self.refund_method.value if self.refund_method else None,
            'refund_reference': self.refund_reference,
            'refunded_at': self.refunded_at.isoformat() if self.refunded_at else None,
            'admin_notes': self.admin_notes,
            'rejection_reason': self.rejection_reason,
            'is_warranty_claim': self.is_warranty_claim,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_order and self.order:
            data['order_number'] = self.order.order_number
        
        if self.order_item:
            data['product_name'] = self.order_item.product_name
            data['product_price'] = float(self.order_item.product_price)
        
        return data
    
    def __repr__(self):
        return f'<Return {self.return_number}>'


class SupplierPayout(db.Model):
    """Supplier payout model for tracking payments to suppliers."""
    
    __tablename__ = 'supplier_payouts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    payout_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    supplier_id = db.Column(db.String(36), db.ForeignKey('supplier_profiles.id'), nullable=False, index=True)
    
    # Payout period
    period_start = db.Column(db.DateTime, nullable=False)
    period_end = db.Column(db.DateTime, nullable=False)
    
    # Amounts
    gross_amount = db.Column(db.Numeric(12, 2), nullable=False)  # Total earnings
    return_deductions = db.Column(db.Numeric(12, 2), default=0, nullable=False)  # Deductions for returns
    net_amount = db.Column(db.Numeric(12, 2), nullable=False)  # After deductions
    
    # Payment details
    payment_method = db.Column(db.String(50), default='mpesa', nullable=False)
    payment_reference = db.Column(db.String(100), nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)
    
    # Status
    status = db.Column(db.String(50), default='pending', nullable=False, index=True)  # pending, processing, completed, failed
    
    # Order items included
    order_items_count = db.Column(db.Integer, default=0, nullable=False)
    
    # Admin notes
    notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def generate_payout_number(self):
        """Generate unique payout number."""
        # Format: PAY-YYYYMMDD-XXXX
        date_str = datetime.utcnow().strftime('%Y%m%d')
        count = SupplierPayout.query.filter(
            SupplierPayout.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        ).count() + 1
        
        self.payout_number = f'PAY-{date_str}-{count:04d}'
    
    def to_dict(self):
        """Convert payout to dictionary."""
        return {
            'id': self.id,
            'payout_number': self.payout_number,
            'supplier_id': self.supplier_id,
            'period_start': self.period_start.isoformat() if self.period_start else None,
            'period_end': self.period_end.isoformat() if self.period_end else None,
            'gross_amount': float(self.gross_amount),
            'return_deductions': float(self.return_deductions),
            'net_amount': float(self.net_amount),
            'payment_method': self.payment_method,
            'payment_reference': self.payment_reference,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'status': self.status,
            'order_items_count': self.order_items_count,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<SupplierPayout {self.payout_number}>'
