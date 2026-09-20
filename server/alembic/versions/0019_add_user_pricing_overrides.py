"""add user_pricing_overrides table

Revision ID: 0019_add_user_pricing_overrides
Revises: 0018_add_api_price
Create Date: 2026-09-20 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0019_add_user_pricing_overrides'
down_revision = '0018_add_api_price'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not inspector.has_table('user_pricing_overrides'):
        op.create_table(
            'user_pricing_overrides',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('data_plan_id', sa.Integer(), nullable=False),
            sa.Column('custom_price', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['data_plan_id'], ['data_plans.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_user_pricing_overrides_id'), 'user_pricing_overrides', ['id'], unique=False)
        op.create_index('ix_user_pricing_overrides_user_plan', 'user_pricing_overrides', ['user_id', 'data_plan_id'], unique=True)


def downgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if inspector.has_table('user_pricing_overrides'):
        op.drop_index('ix_user_pricing_overrides_user_plan', table_name='user_pricing_overrides')
        op.drop_index(op.f('ix_user_pricing_overrides_id'), table_name='user_pricing_overrides')
        op.drop_table('user_pricing_overrides')
