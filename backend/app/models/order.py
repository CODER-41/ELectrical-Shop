import uuid
from datetime import datetime
from enum import Enum
from datetime import timedelta
from app.models import db


class OrderStatus(str, Enum):
    """Order status enumeration."""
    PENDING = 'pending'  # Order created, awaiting payment
    PAID = 'paid'  # Payment confirmed
    PROCESSING = 'processing'  # Quality check in progress
    QUALITY_APPROVED = 'quality_approved'  # Passed quality check
    SHIPPED = 'shipped'  # Ready for delivery
    OUT_FOR_DELIVERY = 'out_for_delivery'  # Agent started delivery
    ARRIVED = 'arrived'  # Agent arrived at destination
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

    # COD (Cash on Delivery) specific fields
    cod_collected_by = db.Column(db.String(36), nullable=True)  # Delivery person who collected cash
    cod_collected_at = db.Column(db.DateTime, nullable=True)  # When cash was collected
    cod_amount_collected = db.Column(db.Numeric(12, 2), nullable=True)  # Amount collected
    cod_verified_by = db.Column(db.String(36), nullable=True)  # Admin who verified COD payment
    cod_verified_at = db.Column(db.DateTime, nullable=True)  # When COD was verified

    # Delivery assignment
    assigned_delivery_agent = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True, index=True)
    assigned_delivery_company = db.Column(db.String(36), db.ForeignKey('delivery_companies.id'), nullable=True)

    # Delivery confirmation workflow
    delivery_confirmed_by_agent = db.Column(db.Boolean, default=False, nullable=False)
    delivery_confirmed_at = db.Column(db.DateTime, nullable=True)  # When agent confirmed
    delivery_proof_photo = db.Column(db.String(500), nullable=True)  # Photo URL of delivered package
    delivery_recipient_name = db.Column(db.String(100), nullable=True)  # Who received it
    delivery_notes = db.Column(db.Text, nullable=True)  # Delivery notes/comments

    # Customer confirmation
    customer_confirmed_delivery = db.Column(db.Boolean, default=False, nullable=False)
    customer_confirmed_at = db.Column(db.DateTime, nullable=True)
    customer_dispute = db.Column(db.Boolean, default=False, nullable=False)
    customer_dispute_reason = db.Column(db.Text, nullable=True)

    # Auto-confirmation (24 hours after agent confirms without customer dispute)
    auto_confirmed = db.Column(db.Boolean, default=False, nullable=False)
    auto_confirm_deadline = db.Column(db.DateTime, nullable=True)  # When auto-confirm will trigger

    # Delivery payment (paid to delivery agent/company)
    delivery_fee_paid = db.Column(db.Boolean, default=False, nullable=False)
    delivery_fee_paid_at = db.Column(db.DateTime, nullable=True)
    delivery_payment_reference = db.Column(db.String(100), nullable=True)

    # Order status
    status = db.Column(db.Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)

    # Notes
    customer_notes = db.Column(db.Text, nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    delivery_address = db.relationship('Address', foreign_keys=[delivery_address_id], lazy='select')
    items = db.relationship('OrderItem', backref='order', lazy='dynamic', cascade='all, delete-orphan')

    def confirm_cod_collection(self, collector_id, amount):
        """Record COD collection by delivery person."""
        if self.payment_method == PaymentMethod.CASH:
            self.cod_collected_by = collector_id
            self.cod_collected_at = datetime.utcnow()
            self.cod_amount_collected = amount
            return True
        return False

    def verify_cod_payment(self, admin_id):
        """Admin verifies COD payment was received."""
        if self.payment_method == PaymentMethod.CASH and self.cod_collected_at:
            self.cod_verified_by = admin_id
            self.cod_verified_at = datetime.utcnow()
            self.payment_status = PaymentStatus.COMPLETED
            self.paid_at = datetime.utcnow()
            return True
        return False

    def confirm_delivery_by_agent(self, proof_photo=None, recipient_name=None, notes=None):
        """Agent confirms delivery with optional proof."""
        self.delivery_confirmed_by_agent = True
        self.delivery_confirmed_at = datetime.utcnow()
        self.delivery_proof_photo = proof_photo
        self.delivery_recipient_name = recipient_name
        self.delivery_notes = notes
        # Set auto-confirm deadline to 24 hours from now
        self.auto_confirm_deadline = datetime.utcnow() + timedelta(hours=24)
        self.status = OrderStatus.DELIVERED
        return True

    def confirm_delivery_by_customer(self):
        """Customer confirms they received the order."""
        if self.delivery_confirmed_by_agent:
            self.customer_confirmed_delivery = True
            self.customer_confirmed_at = datetime.utcnow()
            return True
        return False

    def raise_delivery_dispute(self, reason):
        """Customer disputes the delivery."""
        if self.delivery_confirmed_by_agent and not self.customer_confirmed_delivery:
            self.customer_dispute = True
            self.customer_dispute_reason = reason
            return True
        return False

    def auto_confirm_delivery(self):
        """Auto-confirm delivery after timeout (24 hours)."""
        if (self.delivery_confirmed_by_agent and
            not self.customer_confirmed_delivery and
            not self.customer_dispute and
            self.auto_confirm_deadline and
            datetime.utcnow() >= self.auto_confirm_deadline):
            self.auto_confirmed = True
            self.customer_confirmed_delivery = True
            self.customer_confirmed_at = datetime.utcnow()
            return True
        return False

    def is_delivery_confirmed(self):
        """Check if delivery is confirmed (by customer or auto)."""
        return self.customer_confirmed_delivery or self.auto_confirmed

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
        from app.models.address import Address
        from app.models.user import CustomerProfile
        
        delivery_address = Address.query.get(self.delivery_address_id) if self.delivery_address_id else None
        customer = CustomerProfile.query.get(self.customer_id) if self.customer_id else None
        
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'customer_id': self.customer_id,
            'customer': {
                'name': f"{customer.first_name} {customer.last_name}",
                'email': customer.user.email if customer and customer.user else None,
                'phone': customer.phone_number
            } if customer else None,
            'delivery_address': delivery_address.to_dict() if delivery_address else None,
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
            'cod_collected_at': self.cod_collected_at.isoformat() if self.cod_collected_at else None,
            'cod_amount_collected': float(self.cod_amount_collected) if self.cod_amount_collected else None,
            'cod_verified_at': self.cod_verified_at.isoformat() if self.cod_verified_at else None,
            'assigned_delivery_agent': self.assigned_delivery_agent,
            'assigned_delivery_company': self.assigned_delivery_company,
            'delivery_confirmed_by_agent': self.delivery_confirmed_by_agent,
            'delivery_confirmed_at': self.delivery_confirmed_at.isoformat() if self.delivery_confirmed_at else None,
            'delivery_proof_photo': self.delivery_proof_photo,
            'delivery_recipient_name': self.delivery_recipient_name,
            'delivery_notes': self.delivery_notes,
            'customer_confirmed_delivery': self.customer_confirmed_delivery,
            'customer_confirmed_at': self.customer_confirmed_at.isoformat() if self.customer_confirmed_at else None,
            'customer_dispute': self.customer_dispute,
            'customer_dispute_reason': self.customer_dispute_reason,
            'auto_confirmed': self.auto_confirmed,
            'auto_confirm_deadline': self.auto_confirm_deadline.isoformat() if self.auto_confirm_deadline else None,
            'delivery_fee_paid': self.delivery_fee_paid,
            'delivery_fee_paid_at': self.delivery_fee_paid_at.isoformat() if self.delivery_fee_paid_at else None,
            'delivery_payment_reference': self.delivery_payment_reference,
            'is_delivery_confirmed': self.is_delivery_confirmed(),
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
            from datetime import datetime, timedelta
            # Approximate months as 30 days each
            days = self.warranty_period_months * 30
            self.warranty_expires_at = datetime.utcnow() + timedelta(days=days)
    
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
