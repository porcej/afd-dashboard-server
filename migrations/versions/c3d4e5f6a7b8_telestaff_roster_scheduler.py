"""telestaff_settings: roster scheduler flags

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-03

"""
from alembic import op
import sqlalchemy as sa


revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "telestaff_settings",
        sa.Column(
            "roster_scheduler_enabled",
            sa.Boolean(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "telestaff_settings",
        sa.Column(
            "roster_fetch_interval_seconds",
            sa.Integer(),
            nullable=False,
            server_default="900",
        ),
    )


def downgrade():
    op.drop_column("telestaff_settings", "roster_fetch_interval_seconds")
    op.drop_column("telestaff_settings", "roster_scheduler_enabled")
