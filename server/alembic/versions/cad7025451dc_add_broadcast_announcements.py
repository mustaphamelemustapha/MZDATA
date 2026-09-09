"""add broadcast_announcements table

Revision ID: cad7025451dc
Revises: aa3685e1a68f
Create Date: 2026-06-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cad7025451dc'
down_revision: Union[str, None] = 'aa3685e1a68f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'broadcast_announcements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('level', sa.Enum('info', 'success', 'warning', 'critical', name='announcementlevel'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by_email', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_broadcast_announcements_id'), 'broadcast_announcements', ['id'], unique=False)
    op.create_index(
        'ix_broadcast_announcements_active_window',
        'broadcast_announcements',
        ['is_active', 'starts_at', 'ends_at'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_broadcast_announcements_active_window', table_name='broadcast_announcements')
    op.drop_index(op.f('ix_broadcast_announcements_id'), table_name='broadcast_announcements')
    op.drop_table('broadcast_announcements')
    op.execute('DROP TYPE IF EXISTS announcementlevel')
