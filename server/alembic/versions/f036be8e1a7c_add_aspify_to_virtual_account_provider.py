"""add aspify to virtual_account_provider enum

Revision ID: f036be8e1a7c
Revises: f036be8e1a7b
Create Date: 2026-09-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f036be8e1a7c'
down_revision: Union[str, None] = 'f036be8e1a7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        # Disable auto-commit for enum alter type
        with op.get_context().autocommit_block():
            try:
                op.execute("ALTER TYPE virtualaccountprovider ADD VALUE IF NOT EXISTS 'ASPIFY'")
                op.execute("ALTER TYPE virtualaccountprovider ADD VALUE IF NOT EXISTS 'aspify'")
            except Exception as e:
                pass


def downgrade() -> None:
    pass
