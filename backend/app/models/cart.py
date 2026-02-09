"""
Cart model for shopping cart functionality.
"""

from datetime import datetime, timezone
from app.models import db
import uuid


class Cart(db.Model):
    """Shopping cart for customers."""
    __tablename__ = 'carts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', backref=db.backref('cart', uselist=False, lazy='joined'))
    items = db.relationship('CartItem', backref='cart', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_items=True):
        """Convert cart to dictionary."""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'item_count': self.items.count(),
            'subtotal': self.get_subtotal(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_items:
            data['items'] = [item.to_dict() for item in self.items.all()]

        return data

    def get_subtotal(self):
        """Calculate cart subtotal."""
        total = 0
        for item in self.items.all():
            if item.product and item.product.is_active:
                total += float(item.product.price) * item.quantity
        return round(total, 2)

    def get_item_count(self):
        """Get total number of items in cart."""
        return sum(item.quantity for item in self.items.all())

    def clear(self):
        """Remove all items from cart."""
        self.items.delete()

    def __repr__(self):
        return f'<Cart {self.id} - User: {self.user_id}>'


class CartItem(db.Model):
    """Individual item in a shopping cart."""
    __tablename__ = 'cart_items'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cart_id = db.Column(db.String(36), db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    added_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    product = db.relationship('Product', backref=db.backref('cart_items', lazy='dynamic'))

    # Unique constraint to prevent duplicate products in cart
    __table_args__ = (
        db.UniqueConstraint('cart_id', 'product_id', name='unique_cart_product'),
    )

    def to_dict(self):
        """Convert cart item to dictionary."""
        product_data = None
        if self.product:
            product_data = {
                'id': self.product.id,
                'name': self.product.name,
                'slug': self.product.slug,
                'price': float(self.product.price),
                'image_url': self.product.image_url,
                'stock_quantity': self.product.stock_quantity,
                'is_active': self.product.is_active,
                'supplier_id': self.product.supplier_id
            }

        return {
            'id': self.id,
            'cart_id': self.cart_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'subtotal': self.get_subtotal(),
            'product': product_data,
            'added_at': self.added_at.isoformat() if self.added_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def get_subtotal(self):
        """Calculate item subtotal."""
        if self.product:
            return round(float(self.product.price) * self.quantity, 2)
        return 0

    def is_available(self):
        """Check if the product is available and in stock."""
        if not self.product:
            return False
        return self.product.is_active and self.product.stock_quantity >= self.quantity

    def __repr__(self):
        return f'<CartItem {self.id} - Product: {self.product_id}, Qty: {self.quantity}>'