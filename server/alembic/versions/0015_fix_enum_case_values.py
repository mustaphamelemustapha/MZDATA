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
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    def has_table(table_name):
        return inspector.has_table(table_name)
    
    # Fix transaction types
    if has_table('transactions'):
        op.execute("UPDATE transactions SET tx_type = LOWER(tx_type::text)::transactiontype WHERE tx_type::text != LOWER(tx_type::text)")
        op.execute("UPDATE transactions SET status = LOWER(status::text)::transactionstatus WHERE status::text != LOWER(status::text)")
    
    # Fix disputes
    if has_table('transaction_disputes'):
        op.execute("UPDATE transaction_disputes SET status = LOWER(status::text)::disputestatus WHERE status::text != LOWER(status::text)")
    
    # Fix virtual accounts
    if has_table('virtual_accounts'):
        op.execute("UPDATE virtual_accounts SET provider = LOWER(provider::text)::virtualaccountprovider WHERE provider::text != LOWER(provider::text)")
        op.execute("UPDATE virtual_accounts SET status = LOWER(status::text)::virtualaccountstatus WHERE status::text != LOWER(status::text)")
    
    # Fix financial ledgers (native_enum=False, so they are VARCHAR)
    if has_table('financial_ledger'):
        op.execute("UPDATE financial_ledger SET category = LOWER(category::text) WHERE category::text != LOWER(category::text)")
        op.execute("UPDATE financial_ledger SET entry_type = LOWER(entry_type::text) WHERE entry_type::text != LOWER(entry_type::text)")
    
    # Fix agents
    if has_table('reward_campaigns'):
        op.execute("UPDATE reward_campaigns SET campaign_type = LOWER(campaign_type::text)::campaigntype WHERE campaign_type::text != LOWER(campaign_type::text)")
    if has_table('agent_rewards'):
        op.execute("UPDATE agent_rewards SET status = LOWER(status::text)::agentrewardstatus WHERE status::text != LOWER(status::text)")

def downgrade():
    pass
