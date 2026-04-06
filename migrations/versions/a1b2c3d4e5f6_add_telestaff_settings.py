"""add telestaff_settings singleton table

Revision ID: a1b2c3d4e5f6
Revises: 7f480dbaa883
Create Date: 2026-04-03

"""
from alembic import op
import sqlalchemy as sa


revision = "a1b2c3d4e5f6"
down_revision = "7f480dbaa883"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "telestaff_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("server_url", sa.String(length=512), nullable=True),
        sa.Column("cookie_header", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("telestaff_settings")
