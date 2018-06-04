"""Initial Database

Revision ID: 7f480dbaa883
Revises: 
Create Date: 2018-05-30 21:27:01.095905

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7f480dbaa883'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('alert',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('content', sa.String(length=2048), nullable=True),
    sa.Column('timestamp', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_alert_timestamp'), 'alert', ['timestamp'], unique=False)
    op.create_table('roster',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('date', sa.String(length=90), nullable=True),
    sa.Column('content', sa.String(), nullable=True),
    sa.Column('timestamp', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roster_date'), 'roster', ['date'], unique=False)
    op.create_index(op.f('ix_roster_timestamp'), 'roster', ['timestamp'], unique=False)
    op.create_table('station',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=24), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_station_name'), 'station', ['name'], unique=True)
    op.create_table('unit',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=24), nullable=True),
    sa.Column('home_id', sa.Integer(), nullable=True),
    sa.Column('alert_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['alert_id'], ['station.id'], ),
    sa.ForeignKeyConstraint(['home_id'], ['station.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_unit_name'), 'unit', ['name'], unique=True)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_unit_name'), table_name='unit')
    op.drop_table('unit')
    op.drop_index(op.f('ix_station_name'), table_name='station')
    op.drop_table('station')
    op.drop_index(op.f('ix_roster_timestamp'), table_name='roster')
    op.drop_index(op.f('ix_roster_date'), table_name='roster')
    op.drop_table('roster')
    op.drop_index(op.f('ix_alert_timestamp'), table_name='alert')
    op.drop_table('alert')
    # ### end Alembic commands ###
