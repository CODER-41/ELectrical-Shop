"""Add delivery company and confirmation workflow

Revision ID: b123456789ab
Revises: a909e83c90c9
Create Date: 2026-02-04 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b123456789ab'
down_revision = 'a909e83c90c9'
branch_labels = None
depends_on = None


def upgrade():
    # Create DeliveryPartnerType enum
    delivery_partner_type_enum = sa.Enum('IN_HOUSE', 'INDIVIDUAL', 'COMPANY', name='deliverypartnertype')
    delivery_partner_type_enum.create(op.get_bind(), checkfirst=True)

    # Create delivery_companies table
    op.create_table('delivery_companies',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('contact_email', sa.String(length=120), nullable=True),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('api_key', sa.String(length=255), nullable=True),
        sa.Column('api_endpoint', sa.String(length=500), nullable=True),
        sa.Column('webhook_url', sa.String(length=500), nullable=True),
        sa.Column('is_api_integrated', sa.Boolean(), nullable=False, default=False),
        sa.Column('mpesa_paybill', sa.String(length=20), nullable=True),
        sa.Column('mpesa_account', sa.String(length=50), nullable=True),
        sa.Column('delivery_fee_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=80.00),
        sa.Column('settlement_period_days', sa.Integer(), nullable=False, default=7),
        sa.Column('minimum_payout_amount', sa.Numeric(precision=10, scale=2), nullable=False, default=1000.00),
        sa.Column('pending_balance', sa.Numeric(precision=12, scale=2), nullable=False, default=0.00),
        sa.Column('total_paid', sa.Numeric(precision=12, scale=2), nullable=False, default=0.00),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('service_zones', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Add new columns to delivery_agent_profiles
    with op.batch_alter_table('delivery_agent_profiles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('partner_type', sa.Enum('IN_HOUSE', 'INDIVIDUAL', 'COMPANY', name='deliverypartnertype'), nullable=True))
        batch_op.add_column(sa.Column('mpesa_number', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('delivery_fee_percentage', sa.Numeric(precision=5, scale=2), nullable=True))
        batch_op.add_column(sa.Column('total_earnings', sa.Numeric(precision=12, scale=2), nullable=True))
        batch_op.add_column(sa.Column('pending_payout', sa.Numeric(precision=12, scale=2), nullable=True))

    # Set default values for existing rows
    op.execute("UPDATE delivery_agent_profiles SET partner_type = 'IN_HOUSE' WHERE partner_type IS NULL")
    op.execute("UPDATE delivery_agent_profiles SET delivery_fee_percentage = 70.00 WHERE delivery_fee_percentage IS NULL")
    op.execute("UPDATE delivery_agent_profiles SET total_earnings = 0.00 WHERE total_earnings IS NULL")
    op.execute("UPDATE delivery_agent_profiles SET pending_payout = 0.00 WHERE pending_payout IS NULL")

    # Make columns not nullable after setting defaults
    with op.batch_alter_table('delivery_agent_profiles', schema=None) as batch_op:
        batch_op.alter_column('partner_type', nullable=False, server_default='IN_HOUSE')
        batch_op.alter_column('delivery_fee_percentage', nullable=False, server_default='70.00')
        batch_op.alter_column('total_earnings', nullable=False, server_default='0.00')
        batch_op.alter_column('pending_payout', nullable=False, server_default='0.00')

    # Add new columns to orders table for delivery confirmation workflow
    with op.batch_alter_table('orders', schema=None) as batch_op:
        # Delivery company assignment
        batch_op.add_column(sa.Column('assigned_delivery_company', sa.String(length=36), nullable=True))

        # Delivery confirmation by agent
        batch_op.add_column(sa.Column('delivery_confirmed_by_agent', sa.Boolean(), nullable=False, server_default='false'))
        batch_op.add_column(sa.Column('delivery_confirmed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('delivery_proof_photo', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('delivery_recipient_name', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('delivery_notes', sa.Text(), nullable=True))

        # Customer confirmation
        batch_op.add_column(sa.Column('customer_confirmed_delivery', sa.Boolean(), nullable=False, server_default='false'))
        batch_op.add_column(sa.Column('customer_confirmed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('customer_dispute', sa.Boolean(), nullable=False, server_default='false'))
        batch_op.add_column(sa.Column('customer_dispute_reason', sa.Text(), nullable=True))

        # Auto-confirmation
        batch_op.add_column(sa.Column('auto_confirmed', sa.Boolean(), nullable=False, server_default='false'))
        batch_op.add_column(sa.Column('auto_confirm_deadline', sa.DateTime(), nullable=True))

        # Delivery payment tracking
        batch_op.add_column(sa.Column('delivery_fee_paid', sa.Boolean(), nullable=False, server_default='false'))
        batch_op.add_column(sa.Column('delivery_fee_paid_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('delivery_payment_reference', sa.String(length=100), nullable=True))

        # Add foreign key for delivery company
        batch_op.create_foreign_key('fk_orders_delivery_company', 'delivery_companies', ['assigned_delivery_company'], ['id'])

    # Create DeliveryPayoutType enum and delivery_payouts table using raw SQL
    # to avoid SQLAlchemy trying to auto-create the enum twice
    op.execute("CREATE TYPE deliverypayouttype AS ENUM ('AGENT', 'COMPANY')")

    op.execute("""
        CREATE TABLE delivery_payouts (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            payout_number VARCHAR(50) NOT NULL UNIQUE,
            payout_type deliverypayouttype NOT NULL,
            delivery_agent_id VARCHAR(36) REFERENCES delivery_agent_profiles(id),
            delivery_company_id VARCHAR(36) REFERENCES delivery_companies(id),
            gross_amount NUMERIC(12, 2) NOT NULL,
            platform_fee NUMERIC(12, 2) NOT NULL,
            net_amount NUMERIC(12, 2) NOT NULL,
            order_count INTEGER NOT NULL DEFAULT 0,
            order_ids JSON,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            payment_method VARCHAR(50) NOT NULL DEFAULT 'mpesa',
            payment_reference VARCHAR(100),
            mpesa_number VARCHAR(20),
            period_start TIMESTAMP WITHOUT TIME ZONE,
            period_end TIMESTAMP WITHOUT TIME ZONE,
            notes TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            processed_at TIMESTAMP WITHOUT TIME ZONE,
            processed_by VARCHAR(36) REFERENCES users(id)
        )
    """)
    op.execute("CREATE INDEX ix_delivery_payouts_payout_number ON delivery_payouts(payout_number)")
    op.execute("CREATE INDEX ix_delivery_payouts_status ON delivery_payouts(status)")


def downgrade():
    # Drop delivery_payouts table and indexes
    op.drop_index('ix_delivery_payouts_status', table_name='delivery_payouts')
    op.drop_index('ix_delivery_payouts_payout_number', table_name='delivery_payouts')
    op.drop_table('delivery_payouts')

    # Drop DeliveryPayoutType enum
    delivery_payout_type_enum = sa.Enum('AGENT', 'COMPANY', name='deliverypayouttype')
    delivery_payout_type_enum.drop(op.get_bind(), checkfirst=True)

    # Remove foreign key and columns from orders
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.drop_constraint('fk_orders_delivery_company', type_='foreignkey')
        batch_op.drop_column('delivery_payment_reference')
        batch_op.drop_column('delivery_fee_paid_at')
        batch_op.drop_column('delivery_fee_paid')
        batch_op.drop_column('auto_confirm_deadline')
        batch_op.drop_column('auto_confirmed')
        batch_op.drop_column('customer_dispute_reason')
        batch_op.drop_column('customer_dispute')
        batch_op.drop_column('customer_confirmed_at')
        batch_op.drop_column('customer_confirmed_delivery')
        batch_op.drop_column('delivery_notes')
        batch_op.drop_column('delivery_recipient_name')
        batch_op.drop_column('delivery_proof_photo')
        batch_op.drop_column('delivery_confirmed_at')
        batch_op.drop_column('delivery_confirmed_by_agent')
        batch_op.drop_column('assigned_delivery_company')

    # Remove columns from delivery_agent_profiles
    with op.batch_alter_table('delivery_agent_profiles', schema=None) as batch_op:
        batch_op.drop_column('pending_payout')
        batch_op.drop_column('total_earnings')
        batch_op.drop_column('delivery_fee_percentage')
        batch_op.drop_column('mpesa_number')
        batch_op.drop_column('partner_type')

    # Drop delivery_companies table
    op.drop_table('delivery_companies')

    # Drop enum type
    delivery_partner_type_enum = sa.Enum('IN_HOUSE', 'INDIVIDUAL', 'COMPANY', name='deliverypartnertype')
    delivery_partner_type_enum.drop(op.get_bind(), checkfirst=True)
