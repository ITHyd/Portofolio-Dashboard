"""widen metric_definitions columns

Revision ID: 0002_widen_metric_columns
Revises: 0001_initial
Create Date: 2026-05-12

"""
from alembic import op
import sqlalchemy as sa

revision = "0002_widen_metric_columns"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("metric_definitions", "unit", type_=sa.Text(), existing_type=sa.String(64), existing_nullable=True)
    op.alter_column("metric_definitions", "update_frequency", type_=sa.String(128), existing_type=sa.String(64), existing_nullable=True)
    op.alter_column("metric_definitions", "data_owner", type_=sa.String(255), existing_type=sa.String(128), existing_nullable=True)


def downgrade() -> None:
    op.alter_column("metric_definitions", "data_owner", type_=sa.String(128), existing_type=sa.String(255), existing_nullable=True)
    op.alter_column("metric_definitions", "update_frequency", type_=sa.String(64), existing_type=sa.String(128), existing_nullable=True)
    op.alter_column("metric_definitions", "unit", type_=sa.String(64), existing_type=sa.Text(), existing_nullable=True)
