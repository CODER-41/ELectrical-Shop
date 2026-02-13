#!/usr/bin/env python3
"""Add missing columns to returns table."""

from app import create_app
from app.models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Add order_item_id column if it doesn't exist
        db.session.execute(text("""
            ALTER TABLE returns 
            ADD COLUMN IF NOT EXISTS order_item_id VARCHAR(36);
        """))
        
        # Add supplier response columns if they don't exist
        db.session.execute(text("""
            ALTER TABLE returns 
            ADD COLUMN IF NOT EXISTS supplier_acknowledged BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS supplier_acknowledged_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS supplier_response TEXT,
            ADD COLUMN IF NOT EXISTS supplier_evidence JSON,
            ADD COLUMN IF NOT EXISTS supplier_action VARCHAR(20),
            ADD COLUMN IF NOT EXISTS supplier_action_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS supplier_dispute_reason TEXT;
        """))
        
        db.session.commit()
        print("✅ Returns table updated successfully")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error: {e}")
