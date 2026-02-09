import uuid
from app.models import db
from datetime import datetime
from enum import Enum


class ReturnStatus(str, Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    COMPLETED = 'completed'


class RefundPolicy(str, Enum):
    SUPPLIER_FAULT = 'supplier_fault'  # Defective/wrong product - supplier pays 100%
    CUSTOMER_CHANGED_MIND = 'customer_changed_mind'  # Customer pays restocking fee
    SHIPPING_DAMAGE = 'shipping_damage'  # Platform absorbs cost
    FRAUD = 'fraud'  # Supplier pays + penalty


class Return(db.Model):
    __tablename__ = 'returns'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.String(500), nullable=False)
    status = db.Column(db.Enum(ReturnStatus), default=ReturnStatus.PENDING, nullable=False)
    
    # Refund policy fields
    refund_policy = db.Column(db.String(50), default='supplier_fault', nullable=True)
    refund_amount = db.Column(db.Numeric(12, 2), nullable=True)
    restocking_fee = db.Column(db.Numeric(12, 2), default=0, nullable=True)
    supplier_deduction = db.Column(db.Numeric(12, 2), default=0, nullable=True)
    platform_deduction = db.Column(db.Numeric(12, 2), default=0, nullable=True)
    customer_refund = db.Column(db.Numeric(12, 2), nullable=True)
    refund_processed_at = db.Column(db.DateTime, nullable=True)
    refund_reference = db.Column(db.String(100), nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', backref=db.backref('returns', lazy='dynamic'))
    order = db.relationship('Order', backref=db.backref('returns', lazy='dynamic'))

    def calculate_refund(self, policy=None):
        """Calculate refund amounts based on policy."""
        if not self.order:
            return
        
        order_total = float(self.order.total)
        self.refund_policy = policy or RefundPolicy.SUPPLIER_FAULT.value
        
        if self.refund_policy == RefundPolicy.SUPPLIER_FAULT.value:
            # Supplier pays 100% (including platform commission)
            self.customer_refund = order_total
            self.supplier_deduction = order_total
            self.platform_deduction = 0
            self.restocking_fee = 0
            
        elif self.refund_policy == RefundPolicy.CUSTOMER_CHANGED_MIND.value:
            # 15% restocking fee, platform keeps commission
            self.restocking_fee = order_total * 0.15
            self.customer_refund = order_total - self.restocking_fee
            # Supplier loses 75% of (order_total - restocking_fee)
            self.supplier_deduction = (order_total - self.restocking_fee) * 0.75
            self.platform_deduction = 0  # Platform keeps commission
            
        elif self.refund_policy == RefundPolicy.SHIPPING_DAMAGE.value:
            # Platform absorbs full cost
            self.customer_refund = order_total
            self.supplier_deduction = 0
            self.platform_deduction = order_total
            self.restocking_fee = 0
            
        elif self.refund_policy == RefundPolicy.FRAUD.value:
            # Supplier pays 100% + 10% penalty
            penalty = order_total * 0.10
            self.customer_refund = order_total
            self.supplier_deduction = order_total + penalty
            self.platform_deduction = -penalty  # Platform gains penalty
            self.restocking_fee = 0
        
        self.refund_amount = order_total
    
    def to_dict(self):
        refund_amount = float(self.refund_amount) if self.refund_amount else (float(self.order.total) if self.order else 0)
        
        return {
            'id': self.id,
            'order_id': self.order_id,
            'user_id': self.user_id,
            'reason': self.reason,
            'status': self.status.value if self.status else None,
            'refund_policy': self.refund_policy,
            'refund_amount': refund_amount,
            'restocking_fee': float(self.restocking_fee) if self.restocking_fee else 0,
            'supplier_deduction': float(self.supplier_deduction) if self.supplier_deduction else 0,
            'platform_deduction': float(self.platform_deduction) if self.platform_deduction else 0,
            'customer_refund': float(self.customer_refund) if self.customer_refund else 0,
            'refund_processed_at': self.refund_processed_at.isoformat() if self.refund_processed_at else None,
            'refund_reference': self.refund_reference,
            'admin_notes': self.admin_notes,
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


class DeliveryPayoutType(str, Enum):
    """Type of delivery payout recipient."""
    AGENT = 'agent'  # Individual delivery agent
    COMPANY = 'company'  # Delivery company


class DeliveryPayout(db.Model):
    """Track payments to delivery partners (agents and companies)."""

    __tablename__ = 'delivery_payouts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    payout_number = db.Column(db.String(50), unique=True, nullable=False, index=True)

    # Recipient (either agent or company)
    payout_type = db.Column(db.Enum(DeliveryPayoutType), nullable=False)
    delivery_agent_id = db.Column(db.String(36), db.ForeignKey('delivery_agent_profiles.id'), nullable=True)
    delivery_company_id = db.Column(db.String(36), db.ForeignKey('delivery_companies.id'), nullable=True)

    # Amount details
    gross_amount = db.Column(db.Numeric(12, 2), nullable=False)  # Total delivery fees
    platform_fee = db.Column(db.Numeric(12, 2), nullable=False)  # Platform's cut
    net_amount = db.Column(db.Numeric(12, 2), nullable=False)  # Amount to pay

    # Orders included in this payout
    order_count = db.Column(db.Integer, default=0, nullable=False)
    order_ids = db.Column(db.JSON, nullable=True)  # List of order IDs

    # Payment info
    status = db.Column(db.String(50), default='pending', nullable=False)  # pending, processing, completed, failed
    payment_method = db.Column(db.String(50), default='mpesa', nullable=False)  # mpesa, bank
    payment_reference = db.Column(db.String(100), nullable=True)  # M-Pesa transaction ID
    mpesa_number = db.Column(db.String(20), nullable=True)  # Recipient number

    # Period covered
    period_start = db.Column(db.DateTime, nullable=True)
    period_end = db.Column(db.DateTime, nullable=True)

    # Metadata
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    processed_at = db.Column(db.DateTime, nullable=True)
    processed_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)

    # Relationships
    delivery_agent = db.relationship('DeliveryAgentProfile', backref=db.backref('payouts', lazy='dynamic'))
    delivery_company = db.relationship('DeliveryCompany', backref=db.backref('payouts', lazy='dynamic'))

    def generate_payout_number(self):
        """Generate unique payout number."""
        date_str = datetime.utcnow().strftime('%Y%m%d')
        count = DeliveryPayout.query.filter(
            DeliveryPayout.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        ).count() + 1
        prefix = 'DPA' if self.payout_type == DeliveryPayoutType.AGENT else 'DPC'
        self.payout_number = f'{prefix}-{date_str}-{count:04d}'

    def to_dict(self):
        """Convert to dictionary."""
        data = {
            'id': self.id,
            'payout_number': self.payout_number,
            'payout_type': self.payout_type.value if self.payout_type else None,
            'gross_amount': float(self.gross_amount) if self.gross_amount else 0,
            'platform_fee': float(self.platform_fee) if self.platform_fee else 0,
            'net_amount': float(self.net_amount) if self.net_amount else 0,
            'order_count': self.order_count,
            'status': self.status,
            'payment_method': self.payment_method,
            'payment_reference': self.payment_reference,
            'period_start': self.period_start.isoformat() if self.period_start else None,
            'period_end': self.period_end.isoformat() if self.period_end else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }

        if self.payout_type == DeliveryPayoutType.AGENT and self.delivery_agent:
            data['recipient'] = {
                'id': self.delivery_agent.id,
                'name': f"{self.delivery_agent.first_name} {self.delivery_agent.last_name}",
                'phone': self.delivery_agent.phone_number
            }
        elif self.payout_type == DeliveryPayoutType.COMPANY and self.delivery_company:
            data['recipient'] = {
                'id': self.delivery_company.id,
                'name': self.delivery_company.name,
                'phone': self.delivery_company.contact_phone
            }

        return data

    def __repr__(self):
        return f'<DeliveryPayout {self.payout_number}>'


class ZoneRequestStatus(str, Enum):
    """Status for delivery zone requests."""
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'


class DeliveryZoneRequest(db.Model):
    """Request from delivery agents to be assigned to new zones."""

    __tablename__ = 'delivery_zone_requests'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    delivery_agent_id = db.Column(db.String(36), db.ForeignKey('delivery_agent_profiles.id'), nullable=False)
    zone_id = db.Column(db.String(36), db.ForeignKey('delivery_zones.id'), nullable=False)

    # Request details
    reason = db.Column(db.Text, nullable=True)  # Why they want this zone
    experience = db.Column(db.Text, nullable=True)  # Their experience in this area

    # Status
    status = db.Column(db.Enum(ZoneRequestStatus), default=ZoneRequestStatus.PENDING, nullable=False)
    admin_notes = db.Column(db.Text, nullable=True)  # Admin's review notes

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    reviewed_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)

    # Relationships
    delivery_agent = db.relationship('DeliveryAgentProfile', backref=db.backref('zone_requests', lazy='dynamic'))
    zone = db.relationship('DeliveryZone', backref=db.backref('zone_requests', lazy='dynamic'))

    def approve(self, admin_id, notes=None):
        """Approve the zone request and add zone to agent's assigned zones."""
        self.status = ZoneRequestStatus.APPROVED
        self.reviewed_at = datetime.utcnow()
        self.reviewed_by = admin_id
        self.admin_notes = notes

        # Add zone to agent's assigned zones
        if self.delivery_agent:
            if self.delivery_agent.assigned_zones is None:
                self.delivery_agent.assigned_zones = []
            if self.zone_id not in self.delivery_agent.assigned_zones:
                self.delivery_agent.assigned_zones = self.delivery_agent.assigned_zones + [self.zone_id]

        return True

    def reject(self, admin_id, notes=None):
        """Reject the zone request."""
        self.status = ZoneRequestStatus.REJECTED
        self.reviewed_at = datetime.utcnow()
        self.reviewed_by = admin_id
        self.admin_notes = notes
        return True

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'delivery_agent_id': self.delivery_agent_id,
            'zone_id': self.zone_id,
            'zone_name': self.zone.name if self.zone else None,
            'reason': self.reason,
            'experience': self.experience,
            'status': self.status.value if self.status else None,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'agent_name': f"{self.delivery_agent.first_name} {self.delivery_agent.last_name}" if self.delivery_agent else None
        }

    def __repr__(self):
        return f'<DeliveryZoneRequest {self.id}>'
