"""Add refund policy fields to returns table."""
from app import create_app
from app.models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Adding refund policy fields to returns table...")
    
    # Add new columns
    db.session.execute(text("""
        ALTER TABLE returns 
        ADD COLUMN IF NOT EXISTS refund_policy VARCHAR(50) DEFAULT 'supplier_fault',
        ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12, 2),
        ADD COLUMN IF NOT EXISTS restocking_fee NUMERIC(12, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS supplier_deduction NUMERIC(12, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS platform_deduction NUMERIC(12, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS customer_refund NUMERIC(12, 2),
        ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS refund_reference VARCHAR(100),
        ADD COLUMN IF NOT EXISTS admin_notes TEXT
    """))
    
    db.session.commit()
    print("✓ Refund policy fields added successfully")
