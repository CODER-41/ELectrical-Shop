import uuid
from datetime import datetime
from app.models import db


class Address(db.Model):
    """Address model for delivery addresses."""
    
    __tablename__ = 'addresses'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    label = db.Column(db.String(50), nullable=False)  # e.g., "Home", "Office"
    full_name = db.Column(db.String(200), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    address_line_1 = db.Column(db.String(255), nullable=False)
    address_line_2 = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=False)
    county = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=True)
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    orders = db.relationship('Order', lazy='dynamic', foreign_keys='Order.delivery_address_id')
    
    def to_dict(self):
        """Convert address to dictionary."""
        return {
            'id': self.id,
            'label': self.label,
            'full_name': self.full_name,
            'phone_number': self.phone_number,
            'address_line_1': self.address_line_1,
            'address_line_2': self.address_line_2,
            'city': self.city,
            'county': self.county,
            'postal_code': self.postal_code,
            'is_default': self.is_default
        }
    
    def __repr__(self):
        return f'<Address {self.label} for User {self.user_id}>'
