"""Add missing fields to supplier_payouts table."""
from app import create_app
from app.models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Adding missing supplier_payouts columns...")
    
    db.session.execute(text("""
        ALTER TABLE supplier_payouts
        ADD COLUMN IF NOT EXISTS payout_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100)
    """))
    
    # Create unique index on payout_number
    try:
        db.session.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_payouts_payout_number
            ON supplier_payouts (payout_number) WHERE payout_number IS NOT NULL
        """))
    except Exception:
        db.session.rollback()
    
    # Update existing records to have net_amount = amount if null
    db.session.execute(text("""
        UPDATE supplier_payouts
        SET net_amount = amount
        WHERE net_amount IS NULL
    """))
    
    db.session.commit()
    print("Done. Supplier payout fields added successfully.")
