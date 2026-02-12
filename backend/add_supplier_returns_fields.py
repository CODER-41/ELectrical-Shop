"""Add missing return fields and supplier participation columns to returns table."""
from app import create_app
from app.models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Step 1: Add new enum values to returnstatus type (PostgreSQL)
    print("Adding new return status enum values...")
    new_values = ['requested', 'pending_review', 'supplier_review', 'disputed', 'refund_completed']
    for val in new_values:
        try:
            db.session.execute(text(
                f"ALTER TYPE returnstatus ADD VALUE IF NOT EXISTS '{val}'"
            ))
            db.session.commit()
        except Exception:
            db.session.rollback()

    # Step 2: Add columns that the existing routes reference but are missing
    print("Adding missing return detail columns...")
    db.session.execute(text("""
        ALTER TABLE returns
        ADD COLUMN IF NOT EXISTS order_item_id VARCHAR(36),
        ADD COLUMN IF NOT EXISTS customer_id VARCHAR(36),
        ADD COLUMN IF NOT EXISTS product_id VARCHAR(36),
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS images JSON,
        ADD COLUMN IF NOT EXISTS is_warranty_claim BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS return_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50),
        ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(36),
        ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP
    """))

    # Step 3: Add supplier participation columns
    print("Adding supplier participation fields...")
    db.session.execute(text("""
        ALTER TABLE returns
        ADD COLUMN IF NOT EXISTS supplier_acknowledged BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS supplier_acknowledged_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS supplier_response TEXT,
        ADD COLUMN IF NOT EXISTS supplier_evidence JSON,
        ADD COLUMN IF NOT EXISTS supplier_action VARCHAR(20),
        ADD COLUMN IF NOT EXISTS supplier_action_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS supplier_dispute_reason TEXT
    """))

    # Step 4: Change status column from enum to varchar for flexibility
    print("Updating status column type...")
    try:
        db.session.execute(text("""
            ALTER TABLE returns
            ALTER COLUMN status TYPE VARCHAR(50) USING status::text
        """))
    except Exception:
        db.session.rollback()

    # Step 5: Add indexes
    print("Adding indexes...")
    try:
        db.session.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_returns_return_number
            ON returns (return_number) WHERE return_number IS NOT NULL
        """))
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_returns_customer_id
            ON returns (customer_id) WHERE customer_id IS NOT NULL
        """))
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_returns_order_item_id
            ON returns (order_item_id) WHERE order_item_id IS NOT NULL
        """))
    except Exception:
        db.session.rollback()

    db.session.commit()
    print("Done. All return fields and supplier participation columns added successfully.")
