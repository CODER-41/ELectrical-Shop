import uuid
from datetime import datetime
from app.models import db


# Placeholder models - will be implemented fully in later features


class SupplierPayout(db.Model):
    """Supplier payout model - placeholder for now."""
    
    __tablename__ = 'supplier_payouts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id = db.Column(db.String(36), db.ForeignKey('supplier_profiles.id'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Return(db.Model):
    """Return model - placeholder for now."""
    
    __tablename__ = 'returns'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = db.Column(db.String(36), db.ForeignKey('customer_profiles.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
