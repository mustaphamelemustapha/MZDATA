"""add api_price to dataplan

Revision ID: 0018_add_api_price
Revises: 0017_developer_role
Create Date: 2026-09-19 15:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0018_add_api_price'
down_revision = '0017_developer_role'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('data_plans', sa.Column('api_price', sa.Numeric(precision=12, scale=2), nullable=True))


def downgrade():
    op.drop_column('data_plans', 'api_price')
