import uuid
from datetime import datetime
from enum import Enum
from app.models import db


class OrderStatus(str, Enum):
    """Order status enumeration."""
    PENDING = 'pending'  # Order created, awaiting payment
    PAID = 'paid'  # Payment confirmed
    PROCESSING = 'processing'  # Quality check in progress
    QUALITY_APPROVED = 'quality_approved'  # Passed quality check
    SHIPPED = 'shipped'  # Out for delivery
    DELIVERED = 'delivered'  # Successfully delivered
    CANCELLED = 'cancelled'  # Order cancelled
    RETURNED = 'returned'  # Order returned


class PaymentMethod(str, Enum):
    """Payment method enumeration."""
    MPESA = 'mpesa'
    CARD = 'card'
    CASH = 'cash'


class PaymentStatus(str, Enum):
    """Payment status enumeration."""
    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'
    REFUNDED = 'refunded'


class Order(db.Model):
    """Order model."""
    
    __tablename__ = 'orders'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    customer_id = db.Column(db.String(36), db.ForeignKey('customer_profiles.id'), nullable=False, index=True)
    
    # Delivery information
    delivery_address_id = db.Column(db.String(36), db.ForeignKey('addresses.id'), nullable=False)
    delivery_zone = db.Column(db.String(100), nullable=False)
    delivery_fee = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Pricing
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)
    total = db.Column(db.Numeric(12, 2), nullable=False)  # subtotal + delivery_fee
    
    # Payment
    payment_method = db.Column(db.Enum(PaymentMethod), nullable=False)
    payment_status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_reference = db.Column(db.String(100), nullable=True)  # M-Pesa/Card reference
    paid_at = db.Column(db.DateTime, nullable=True)
    
    # Order status
    status = db.Column(db.Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    
    # Notes
    customer_notes = db.Column(db.Text, nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy='dynamic', cascade='all, delete-orphan')
    
    def generate_order_number(self):
        """Generate unique order number."""
        # Format: ORD-YYYYMMDD-XXXX
        date_str = datetime.utcnow().strftime('%Y%m%d')
        
        # Count orders today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        count = Order.query.filter(Order.created_at >= today_start).count() + 1
        
        self.order_number = f'ORD-{date_str}-{count:04d}'
    
    def calculate_totals(self):
        """Calculate order totals."""
        self.total = float(self.subtotal) + float(self.delivery_fee)
    
    def to_dict(self, include_items=True):
        """Convert order to dictionary."""
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'customer_id': self.customer_id,
            'delivery_address': self.delivery_address.to_dict() if self.delivery_address else None,
            'delivery_zone': self.delivery_zone,
            'delivery_fee': float(self.delivery_fee),
            'subtotal': float(self.subtotal),
            'total': float(self.total),
            'payment_method': self.payment_method.value,
            'payment_status': self.payment_status.value,
            'payment_reference': self.payment_reference,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'status': self.status.value,
            'customer_notes': self.customer_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
            data['items_count'] = self.items.count()
        
        return data
    
    def __repr__(self):
        return f'<Order {self.order_number}>'


class OrderItem(db.Model):
    """Order item model."""
    
    __tablename__ = 'order_items'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False, index=True)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False, index=True)
    supplier_id = db.Column(db.String(36), db.ForeignKey('supplier_profiles.id'), nullable=False, index=True)
    
    # Product details (snapshot at time of order)
    product_name = db.Column(db.String(255), nullable=False)
    product_price = db.Column(db.Numeric(12, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)  # price * quantity
    
    # Commission split (snapshot at time of order)
    supplier_earnings = db.Column(db.Numeric(12, 2), nullable=False)  # subtotal * 0.75
    platform_commission = db.Column(db.Numeric(12, 2), nullable=False)  # subtotal * 0.25
    
    # Warranty
    warranty_period_months = db.Column(db.Integer, nullable=False)
    warranty_expires_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def calculate_amounts(self):
        """Calculate item amounts."""
        self.subtotal = float(self.product_price) * self.quantity
        self.supplier_earnings = float(self.subtotal) * 0.75
        self.platform_commission = float(self.subtotal) * 0.25
        
        # Calculate warranty expiry
        if self.warranty_period_months:
            from dateutil.relativedelta import relativedelta
            self.warranty_expires_at = datetime.utcnow() + relativedelta(months=self.warranty_period_months)
    
    def to_dict(self):
        """Convert order item to dictionary."""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_price': float(self.product_price),
            'quantity': self.quantity,
            'subtotal': float(self.subtotal),
            'supplier_earnings': float(self.supplier_earnings),
            'platform_commission': float(self.platform_commission),
            'warranty_period_months': self.warranty_period_months,
            'warranty_expires_at': self.warranty_expires_at.isoformat() if self.warranty_expires_at else None,
        }
    
    def __repr__(self):
        return f'<OrderItem {self.product_name} x {self.quantity}>'


class DeliveryZone(db.Model):
    """Delivery zone model for delivery fee calculation."""
    
    __tablename__ = 'delivery_zones'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    counties = db.Column(db.JSON, nullable=False)  # List of counties in this zone
    delivery_fee = db.Column(db.Numeric(10, 2), nullable=False)
    estimated_days = db.Column(db.Integer, nullable=False)  # Estimated delivery days
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Convert delivery zone to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'counties': self.counties,
            'delivery_fee': float(self.delivery_fee),
            'estimated_days': self.estimated_days,
            'is_active': self.is_active,
        }
    
    def __repr__(self):
        return f'<DeliveryZone {self.name}>'
