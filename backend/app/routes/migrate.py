"""Add database migration endpoint to fix production."""
from flask import Blueprint
from app.models import db
from app.utils.responses import success_response, error_response
import os

# Create a special blueprint for migrations
migrate_bp = Blueprint('migrate', __name__, url_prefix='/api/migrate')

@migrate_bp.route('/fix-columns', methods=['POST', 'GET'])
def fix_missing_columns():
    """Fix missing columns in production database."""
    
    try:
        results = []
        
        # Add return_number column
        try:
            db.session.execute("""
                ALTER TABLE returns ADD COLUMN IF NOT EXISTS return_number VARCHAR(50) UNIQUE
            """)
            results.append('✓ Added return_number column')
        except Exception as e:
            results.append(f'return_number: {str(e)}')
        
        # Add payout_number column
        try:
            db.session.execute("""
                ALTER TABLE supplier_payouts ADD COLUMN IF NOT EXISTS payout_number VARCHAR(50) UNIQUE
            """)
            results.append('✓ Added payout_number column')
        except Exception as e:
            results.append(f'payout_number: {str(e)}')
        
        # Generate return numbers
        try:
            db.session.execute("""
                UPDATE returns 
                SET return_number = 'RET-' || LPAD(id::text, 8, '0')
                WHERE return_number IS NULL
            """)
            results.append('✓ Generated return numbers')
        except Exception as e:
            results.append(f'generate returns: {str(e)}')
        
        # Generate payout numbers
        try:
            db.session.execute("""
                UPDATE supplier_payouts 
                SET payout_number = 'PAY-' || LPAD(id::text, 8, '0')
                WHERE payout_number IS NULL
            """)
            results.append('✓ Generated payout numbers')
        except Exception as e:
            results.append(f'generate payouts: {str(e)}')
        
        db.session.commit()
        results.append('✓ Database migration completed!')
        
        return success_response(data={'results': results}, message='Migration successful')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Migration failed: {str(e)}', 500)
