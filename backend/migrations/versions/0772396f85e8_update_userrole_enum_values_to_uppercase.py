"""Update userrole enum values to uppercase

Revision ID: 0772396f85e8
Revises: d16158b1a606
Create Date: 2026-02-04 18:21:17.386760

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0772396f85e8'
down_revision = 'd16158b1a606'
branch_labels = None
depends_on = None


def upgrade():
    # Create a new enum type with uppercase values
    op.execute("CREATE TYPE userrole_new AS ENUM ('CUSTOMER', 'SUPPLIER', 'ADMIN', 'PRODUCT_MANAGER', 'FINANCE_ADMIN', 'SUPPORT_ADMIN', 'DELIVERY_AGENT')")
    
    # Update the column to use the new enum type
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole_new USING role::text::userrole_new")
    
    # Drop the old enum type
    op.execute("DROP TYPE userrole")
    
    # Rename the new enum type to the original name
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")


def downgrade():
    # Create a new enum type with lowercase values
    op.execute("CREATE TYPE userrole_new AS ENUM ('customer', 'supplier', 'admin', 'product_manager', 'finance_admin', 'support_admin', 'delivery_agent')")
    
    # Update the column to use the new enum type
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole_new USING role::text::userrole_new")
    
    # Drop the old enum type
    op.execute("DROP TYPE userrole")
    
    # Rename the new enum type to the original name
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")
