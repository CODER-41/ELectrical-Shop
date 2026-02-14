"""Add missing return_number and payout_number columns

Revision ID: add_missing_numbers
Revises: 
Create Date: 2026-02-14

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_missing_numbers'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add return_number to returns table if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='returns' AND column_name='return_number'
            ) THEN
                ALTER TABLE returns ADD COLUMN return_number VARCHAR(50) UNIQUE;
            END IF;
        END $$;
    """)
    
    # Add payout_number to supplier_payouts table if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='supplier_payouts' AND column_name='payout_number'
            ) THEN
                ALTER TABLE supplier_payouts ADD COLUMN payout_number VARCHAR(50) UNIQUE;
            END IF;
        END $$;
    """)
    
    # Generate return numbers for existing returns
    op.execute("""
        UPDATE returns 
        SET return_number = 'RET-' || LPAD(id::text, 8, '0')
        WHERE return_number IS NULL;
    """)
    
    # Generate payout numbers for existing payouts
    op.execute("""
        UPDATE supplier_payouts 
        SET payout_number = 'PAY-' || LPAD(id::text, 8, '0')
        WHERE payout_number IS NULL;
    """)


def downgrade():
    # Remove columns if needed
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='returns' AND column_name='return_number'
            ) THEN
                ALTER TABLE returns DROP COLUMN return_number;
            END IF;
        END $$;
    """)
    
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='supplier_payouts' AND column_name='payout_number'
            ) THEN
                ALTER TABLE supplier_payouts DROP COLUMN payout_number;
            END IF;
        END $$;
    """)
