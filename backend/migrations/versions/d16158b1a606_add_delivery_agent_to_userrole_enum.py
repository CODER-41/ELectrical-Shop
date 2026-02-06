"""Add DELIVERY_AGENT to userrole enum

Revision ID: d16158b1a606
Revises: cc7c498fd4ec
Create Date: 2026-02-04 18:19:12.502282

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd16158b1a606'
down_revision = 'cc7c498fd4ec'
branch_labels = None
depends_on = None


def upgrade():
    # Add DELIVERY_AGENT to the userrole enum
    op.execute("ALTER TYPE userrole ADD VALUE 'delivery_agent'")


def downgrade():
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type, which is complex
    # For now, we'll leave this empty as removing enum values is not straightforward
    pass
