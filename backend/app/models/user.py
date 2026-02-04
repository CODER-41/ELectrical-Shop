import uuid
from datetime import datetime
from enum import Enum
import bcrypt
from app.models import db


class UserRole(str, Enum):
    """User role enumeration matching masterplan."""
    CUSTOMER = 'customer'
    SUPPLIER = 'supplier'
    ADMIN = 'admin'
    PRODUCT_MANAGER = 'product_manager'
    FINANCE_ADMIN = 'finance_admin'
    SUPPORT_ADMIN = 'support_admin'
    DELIVERY_AGENT = 'delivery_agent'


class AuthProvider(str, Enum):
    """Authentication provider enumeration."""
    LOCAL = 'local'
    GOOGLE = 'google'


class User(db.Model):
    """User model for authentication and authorization."""

    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for OAuth users
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    two_fa_enabled = db.Column(db.Boolean, default=False, nullable=False)
    two_fa_secret = db.Column(db.String(32), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)

    # OAuth fields
    auth_provider = db.Column(db.Enum(AuthProvider), default=AuthProvider.LOCAL, nullable=False)
    google_id = db.Column(db.String(100), unique=True, nullable=True, index=True)
    profile_picture = db.Column(db.String(500), nullable=True)
    
    # Relationships
    customer_profile = db.relationship('CustomerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    supplier_profile = db.relationship('SupplierProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    admin_profile = db.relationship('AdminProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    delivery_agent_profile = db.relationship('DeliveryAgentProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    addresses = db.relationship('Address', backref='user', cascade='all, delete-orphan')
    sessions = db.relationship('Session', backref='user', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set user password."""
        salt = bcrypt.gensalt(rounds=12)
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def check_password(self, password):
        """Verify password against hash."""
        if not self.password_hash:
            return False  # OAuth users without password
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def has_password(self):
        """Check if user has a password set (local auth)."""
        return self.password_hash is not None
    
    def to_dict(self, include_profile=False):
        """Convert user to dictionary."""
        data = {
            'id': self.id,
            'email': self.email,
            'role': self.role.value,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'two_fa_enabled': self.two_fa_enabled,
            'auth_provider': self.auth_provider.value if self.auth_provider else 'local',
            'has_password': self.has_password(),
            'profile_picture': self.profile_picture,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        
        if include_profile:
            if self.role == UserRole.CUSTOMER and self.customer_profile:
                data['profile'] = self.customer_profile.to_dict()
            elif self.role == UserRole.SUPPLIER and self.supplier_profile:
                data['profile'] = self.supplier_profile.to_dict()
            elif self.role in [UserRole.ADMIN, UserRole.PRODUCT_MANAGER, UserRole.FINANCE_ADMIN, UserRole.SUPPORT_ADMIN] and self.admin_profile:
                data['profile'] = self.admin_profile.to_dict()
            elif self.role == UserRole.DELIVERY_AGENT and self.delivery_agent_profile:
                data['profile'] = self.delivery_agent_profile.to_dict()

        return data
    
    def __repr__(self):
        return f'<User {self.email} ({self.role.value})>'


class CustomerProfile(db.Model):
    """Customer profile model."""
    
    __tablename__ = 'customer_profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    mpesa_number = db.Column(db.String(20), nullable=True)
    default_address_id = db.Column(db.String(36), db.ForeignKey('addresses.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    orders = db.relationship('Order', backref='customer', lazy='dynamic')
    
    def to_dict(self):
        """Convert customer profile to dictionary."""
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'mpesa_number': self.mpesa_number,
            'default_address_id': self.default_address_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<CustomerProfile {self.first_name} {self.last_name}>'


class PaymentPhoneChangeStatus(str, Enum):
    """Status for payment phone change requests."""
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'


class SupplierProfile(db.Model):
    """Supplier profile model."""

    __tablename__ = 'supplier_profiles'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    business_name = db.Column(db.String(200), nullable=False)
    business_registration_number = db.Column(db.String(100), nullable=True)
    contact_person = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    mpesa_number = db.Column(db.String(20), nullable=False)
    payout_method = db.Column(db.String(20), default='phone', nullable=False)  # phone, paybill, till
    commission_rate = db.Column(db.Numeric(5, 4), default=0.25, nullable=False)
    outstanding_balance = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)
    total_sales = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)
    is_approved = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Payment phone change request fields
    payment_phone_pending = db.Column(db.String(20), nullable=True)
    payment_phone_change_status = db.Column(db.Enum(PaymentPhoneChangeStatus), nullable=True)
    payment_phone_change_requested_at = db.Column(db.DateTime, nullable=True)
    payment_phone_change_reviewed_at = db.Column(db.DateTime, nullable=True)
    payment_phone_change_reviewed_by = db.Column(db.String(36), nullable=True)
    payment_phone_change_reason = db.Column(db.String(500), nullable=True)

    # Relationships
    products = db.relationship('Product', backref='supplier', lazy='dynamic')

    def request_payment_phone_change(self, new_phone, reason=None):
        """Request a payment phone number change."""
        self.payment_phone_pending = new_phone
        self.payment_phone_change_status = PaymentPhoneChangeStatus.PENDING
        self.payment_phone_change_requested_at = datetime.utcnow()
        self.payment_phone_change_reason = reason
        self.payment_phone_change_reviewed_at = None
        self.payment_phone_change_reviewed_by = None

    def approve_payment_phone_change(self, admin_id):
        """Approve a pending payment phone change."""
        if self.payment_phone_pending and self.payment_phone_change_status == PaymentPhoneChangeStatus.PENDING:
            self.mpesa_number = self.payment_phone_pending
            self.payment_phone_pending = None
            self.payment_phone_change_status = PaymentPhoneChangeStatus.APPROVED
            self.payment_phone_change_reviewed_at = datetime.utcnow()
            self.payment_phone_change_reviewed_by = admin_id
            return True
        return False

    def reject_payment_phone_change(self, admin_id, reason=None):
        """Reject a pending payment phone change."""
        if self.payment_phone_change_status == PaymentPhoneChangeStatus.PENDING:
            self.payment_phone_pending = None
            self.payment_phone_change_status = PaymentPhoneChangeStatus.REJECTED
            self.payment_phone_change_reviewed_at = datetime.utcnow()
            self.payment_phone_change_reviewed_by = admin_id
            if reason:
                self.payment_phone_change_reason = reason
            return True
        return False

    def to_dict(self):
        """Convert supplier profile to dictionary."""
        return {
            'id': self.id,
            'business_name': self.business_name,
            'business_registration_number': self.business_registration_number,
            'contact_person': self.contact_person,
            'phone_number': self.phone_number,
            'mpesa_number': self.mpesa_number,
            'payout_method': self.payout_method,
            'commission_rate': float(self.commission_rate),
            'outstanding_balance': float(self.outstanding_balance),
            'total_sales': float(self.total_sales),
            'is_approved': self.is_approved,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'payment_phone_pending': self.payment_phone_pending,
            'payment_phone_change_status': self.payment_phone_change_status.value if self.payment_phone_change_status else None,
            'payment_phone_change_requested_at': self.payment_phone_change_requested_at.isoformat() if self.payment_phone_change_requested_at else None,
        }

    def __repr__(self):
        return f'<SupplierProfile {self.business_name}>'


class AdminProfile(db.Model):
    """Admin profile model."""
    
    __tablename__ = 'admin_profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    permissions = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Convert admin profile to dictionary."""
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'permissions': self.permissions,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<AdminProfile {self.first_name} {self.last_name}>'


class DeliveryPartnerType(str, Enum):
    """Type of delivery partner."""
    IN_HOUSE = 'in_house'  # Our own delivery agents
    INDIVIDUAL = 'individual'  # Freelance bodaboda/riders
    COMPANY = 'company'  # Third-party companies like Sendy, Glovo


class DeliveryAgentProfile(db.Model):
    """Delivery agent profile model for in-house and individual partners."""

    __tablename__ = 'delivery_agent_profiles'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    id_number = db.Column(db.String(20), nullable=True)  # National ID for verification
    vehicle_type = db.Column(db.String(50), nullable=True)  # motorcycle, bicycle, car, on_foot
    vehicle_registration = db.Column(db.String(20), nullable=True)
    assigned_zones = db.Column(db.JSON, nullable=True)  # List of delivery zone IDs
    is_available = db.Column(db.Boolean, default=True, nullable=False)
    total_deliveries = db.Column(db.Integer, default=0, nullable=False)
    total_cod_collected = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)

    # Partner type and payment info
    partner_type = db.Column(db.Enum(DeliveryPartnerType), default=DeliveryPartnerType.IN_HOUSE, nullable=False)
    mpesa_number = db.Column(db.String(20), nullable=True)  # For automated payments
    delivery_fee_percentage = db.Column(db.Numeric(5, 2), default=70.00, nullable=False)  # % of delivery fee they receive
    total_earnings = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)
    pending_payout = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def calculate_delivery_earning(self, delivery_fee):
        """Calculate how much the delivery partner earns from a delivery fee."""
        return float(delivery_fee) * (float(self.delivery_fee_percentage) / 100)

    def to_dict(self):
        """Convert delivery agent profile to dictionary."""
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'id_number': self.id_number,
            'vehicle_type': self.vehicle_type,
            'vehicle_registration': self.vehicle_registration,
            'assigned_zones': self.assigned_zones,
            'is_available': self.is_available,
            'total_deliveries': self.total_deliveries,
            'total_cod_collected': float(self.total_cod_collected),
            'partner_type': self.partner_type.value if self.partner_type else 'in_house',
            'mpesa_number': self.mpesa_number,
            'delivery_fee_percentage': float(self.delivery_fee_percentage),
            'total_earnings': float(self.total_earnings),
            'pending_payout': float(self.pending_payout),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<DeliveryAgentProfile {self.first_name} {self.last_name}>'


class DeliveryCompany(db.Model):
    """Third-party delivery company model (Sendy, Glovo, etc.)."""

    __tablename__ = 'delivery_companies'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False, unique=True)
    contact_email = db.Column(db.String(120), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=True)
    api_key = db.Column(db.String(255), nullable=True)  # For API integration
    api_endpoint = db.Column(db.String(500), nullable=True)
    webhook_url = db.Column(db.String(500), nullable=True)
    is_api_integrated = db.Column(db.Boolean, default=False, nullable=False)

    # Payment info
    mpesa_paybill = db.Column(db.String(20), nullable=True)  # Paybill for company payments
    mpesa_account = db.Column(db.String(50), nullable=True)  # Account number
    delivery_fee_percentage = db.Column(db.Numeric(5, 2), default=80.00, nullable=False)  # % of delivery fee

    # Settlement
    settlement_period_days = db.Column(db.Integer, default=7, nullable=False)  # Days before auto-settlement
    minimum_payout_amount = db.Column(db.Numeric(10, 2), default=1000.00, nullable=False)
    pending_balance = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)
    total_paid = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)

    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    service_zones = db.Column(db.JSON, nullable=True)  # Zones they cover

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convert delivery company to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'is_api_integrated': self.is_api_integrated,
            'delivery_fee_percentage': float(self.delivery_fee_percentage),
            'settlement_period_days': self.settlement_period_days,
            'minimum_payout_amount': float(self.minimum_payout_amount),
            'pending_balance': float(self.pending_balance),
            'total_paid': float(self.total_paid),
            'is_active': self.is_active,
            'service_zones': self.service_zones,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<DeliveryCompany {self.name}>'
