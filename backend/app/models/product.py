import uuid
from datetime import datetime
from enum import Enum
from app.models import db


class ProductCondition(str, Enum):
    """Product condition enumeration."""
    NEW = 'new'
    REFURBISHED = 'refurbished'


class Category(db.Model):
    """Category model for product categorization."""
    
    __tablename__ = 'categories'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), unique=True, nullable=False, index=True)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    suggested_specs = db.Column(db.JSON, nullable=True)  # Template for product specifications
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    products = db.relationship('Product', backref='category', lazy='dynamic')
    
    def to_dict(self):
        """Convert category to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'suggested_specs': self.suggested_specs,
            'is_active': self.is_active,
            'product_count': self.products.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Category {self.name}>'


class Brand(db.Model):
    """Brand model for product brands."""
    
    __tablename__ = 'brands'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), unique=True, nullable=False, index=True)
    logo_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    products = db.relationship('Product', backref='brand', lazy='dynamic')
    
    def to_dict(self):
        """Convert brand to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'logo_url': self.logo_url,
            'is_active': self.is_active,
            'product_count': self.products.count()
        }
    
    def __repr__(self):
        return f'<Brand {self.name}>'


class Product(db.Model):
    """Product model for electronics products."""
    
    __tablename__ = 'products'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id = db.Column(db.String(36), db.ForeignKey('supplier_profiles.id'), nullable=False, index=True)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=False, index=True)
    brand_id = db.Column(db.String(36), db.ForeignKey('brands.id'), nullable=False, index=True)
    
    name = db.Column(db.String(255), nullable=False, index=True)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    short_description = db.Column(db.String(200), nullable=False)
    long_description = db.Column(db.Text, nullable=False)
    
    specifications = db.Column(db.JSON, nullable=True)  # Flexible key-value pairs
    condition = db.Column(db.Enum(ProductCondition), nullable=False, default=ProductCondition.NEW)
    warranty_period_months = db.Column(db.Integer, nullable=False)
    
    price = db.Column(db.Numeric(12, 2), nullable=False, index=True)
    supplier_earnings = db.Column(db.Numeric(12, 2), nullable=False)  # Auto-calculated: price * 0.75
    platform_commission = db.Column(db.Numeric(12, 2), nullable=False)  # Auto-calculated: price * 0.25
    
    stock_quantity = db.Column(db.Integer, default=0, nullable=False, index=True)
    low_stock_threshold = db.Column(db.Integer, default=10, nullable=False)
    
    image_url = db.Column(db.String(500), nullable=True)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    view_count = db.Column(db.Integer, default=0, nullable=False)
    purchase_count = db.Column(db.Integer, default=0, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    supplier = db.relationship('SupplierProfile', backref='products', lazy=True)
    
    def calculate_commission(self):
        """Calculate supplier earnings and platform commission."""
        self.supplier_earnings = float(self.price) * 0.75
        self.platform_commission = float(self.price) * 0.25
    
    def is_low_stock(self):
        """Check if product is low on stock."""
        return self.stock_quantity <= self.low_stock_threshold
    
    def is_in_stock(self):
        """Check if product is in stock."""
        return self.stock_quantity > 0
    
    def increment_view_count(self):
        """Increment product view count."""
        self.view_count += 1
    
    def to_dict(self, include_supplier=False):
        """Convert product to dictionary."""
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'short_description': self.short_description,
            'long_description': self.long_description,
            'specifications': self.specifications,
            'condition': self.condition.value,
            'warranty_period_months': self.warranty_period_months,
            'price': float(self.price),
            'stock_quantity': self.stock_quantity,
            'is_in_stock': self.is_in_stock(),
            'is_low_stock': self.is_low_stock(),
            'image_url': self.image_url,
            'is_active': self.is_active,
            'view_count': self.view_count,
            'purchase_count': self.purchase_count,
            'category': self.category.to_dict() if self.category else None,
            'brand': self.brand.to_dict() if self.brand else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_supplier:
            data['supplier_earnings'] = float(self.supplier_earnings)
            data['platform_commission'] = float(self.platform_commission)
            data['supplier'] = {
                'id': self.supplier.id,
                'business_name': self.supplier.business_name
            } if self.supplier else None
        
        return data
    
    def __repr__(self):
        return f'<Product {self.name}>'
