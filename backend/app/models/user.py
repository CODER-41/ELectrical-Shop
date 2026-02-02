import uuid
from datetime import datetime
from enum import Enum
import bcrypt
from app.models import db


class UserRole(str, Enum):
    """User role enumeration."""
    CUSTOMER = 'customer'
    SUPPLIER = 'supplier'
    ADMIN = 'admin'
    PRODUCT_MANAGER = 'product_manager'
    ORDER_MANAGER = 'order_manager'
    SUPPORT = 'support'


class User(db.Model):
    """User model for authentication and authorization."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    two_fa_enabled = db.Column(db.Boolean, default=False, nullable=False)
    two_fa_secret = db.Column(db.String(32), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    customer_profile = db.relationship('CustomerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    supplier_profile = db.relationship('SupplierProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    admin_profile = db.relationship('AdminProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    addresses = db.relationship('Address', backref='user', cascade='all, delete-orphan')
    sessions = db.relationship('Session', backref='user', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set user password."""
        salt = bcrypt.gensalt(rounds=12)
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def check_password(self, password):
        """Verify password against hash."""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self, include_profile=False):
        """Convert user to dictionary."""
        data = {
            'id': self.id,
            'email': self.email,
            'role': self.role.value,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'two_fa_enabled': self.two_fa_enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        
        if include_profile:
            if self.role == UserRole.CUSTOMER and self.customer_profile:
                data['profile'] = self.customer_profile.to_dict()
            elif self.role == UserRole.SUPPLIER and self.supplier_profile:
                data['profile'] = self.supplier_profile.to_dict()
            elif self.role in [UserRole.ADMIN, UserRole.PRODUCT_MANAGER, UserRole.ORDER_MANAGER, UserRole.SUPPORT] and self.admin_profile:
                data['profile'] = self.admin_profile.to_dict()
        
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
    returns = db.relationship('Return', backref='customer', lazy='dynamic')
    
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
    
    # Relationships
    products = db.relationship('Product', backref='supplier', lazy='dynamic')
    payouts = db.relationship('SupplierPayout', backref='supplier', lazy='dynamic')
    
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
            'created_at': self.created_at.isoformat() if self.created_at else None
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
