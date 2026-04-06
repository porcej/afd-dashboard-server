"""telestaff_settings: last roster fetch time and JSON snapshot

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-03

"""
from alembic import op
import sqlalchemy as sa


revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "telestaff_settings",
        sa.Column("last_roster_fetched_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "telestaff_settings",
        sa.Column("last_roster_json", sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_column("telestaff_settings", "last_roster_json")
    op.drop_column("telestaff_settings", "last_roster_fetched_at")
