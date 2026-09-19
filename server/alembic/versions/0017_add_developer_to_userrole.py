"""add developer to userrole

Revision ID: 0017_developer_role
Revises: 0016_fix_tx_status
Create Date: 2026-09-19 14:18:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0017_developer_role'
down_revision = '0016_fix_tx_status'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        with op.get_context().autocommit_block():
            try:
                op.execute("ALTER TYPE userrole ADD VALUE 'developer'")
            except Exception as e:
                print(f"Notice: {e}")


def downgrade():
    # PostgreSQL does not support removing values from an ENUM type easily.
    pass
