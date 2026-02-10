"""Add terms acceptance fields to supplier profiles."""
from app import create_app
from app.models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Adding terms acceptance fields to supplier_profiles table...")
    
    db.session.execute(text("""
        ALTER TABLE supplier_profiles 
        ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS terms_version VARCHAR(10) DEFAULT '1.0',
        ADD COLUMN IF NOT EXISTS terms_ip_address VARCHAR(50)
    """))
    
    db.session.commit()
    print("✓ Terms acceptance fields added successfully")
