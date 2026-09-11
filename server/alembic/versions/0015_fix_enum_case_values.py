"""fix enum case values

Revision ID: 0015
Revises: f036be8e1a7b
Create Date: 2026-09-11

"""
from alembic import op
import sqlalchemy as sa

revision = '0015_fix_enum_case'
down_revision = 'e6476650fd37'
branch_labels = None
depends_on = None

def upgrade():
    # Fix transaction types
    op.execute("UPDATE transactions SET tx_type = LOWER(tx_type) WHERE tx_type != LOWER(tx_type)")
    op.execute("UPDATE transactions SET status = LOWER(status) WHERE status != LOWER(status)")
    
    # Fix disputes
    op.execute("UPDATE transaction_disputes SET status = LOWER(status) WHERE status != LOWER(status)")
    
    # Fix virtual accounts
    op.execute("UPDATE virtual_accounts SET provider = LOWER(provider) WHERE provider != LOWER(provider)")
    op.execute("UPDATE virtual_accounts SET status = LOWER(status) WHERE status != LOWER(status)")
    
    # Fix financial ledgers
    op.execute("UPDATE financial_ledger SET category = LOWER(category) WHERE category != LOWER(category)")
    op.execute("UPDATE financial_ledger SET entry_type = LOWER(entry_type) WHERE entry_type != LOWER(entry_type)")
    
    # Fix agents
    op.execute("UPDATE reward_campaigns SET campaign_type = LOWER(campaign_type) WHERE campaign_type != LOWER(campaign_type)")
    op.execute("UPDATE agent_rewards SET status = LOWER(status) WHERE status != LOWER(status)")

def downgrade():
    pass
