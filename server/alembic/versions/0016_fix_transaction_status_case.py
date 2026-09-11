"""fix transaction status case

Revision ID: 0016_fix_tx_status
Revises: 0015_fix_enum_case
Create Date: 2026-09-11

"""
from alembic import op
import sqlalchemy as sa

revision = '0016_fix_tx_status'
down_revision = '0015_fix_enum_case'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if inspector.has_table('transactions'):
        # Revert transaction status back to lowercase, as Python still expects it
        op.execute("UPDATE transactions SET status = LOWER(status::text)::transactionstatus WHERE status::text != LOWER(status::text)")

def downgrade():
    pass
