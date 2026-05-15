"""weekly status metadata and project milestone fields

Revision ID: 0003_weekly_status_reminders
Revises: 0002_widen_metric_columns
Create Date: 2026-05-14

"""
from alembic import op
import sqlalchemy as sa


revision = "0003_weekly_status_reminders"
down_revision = "0002_widen_metric_columns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("current_milestone", sa.String(length=255), nullable=True))
    op.add_column("projects", sa.Column("current_milestone_due", sa.Date(), nullable=True))
    op.add_column("projects", sa.Column("current_milestone_status", sa.String(length=32), nullable=True))

    op.add_column("weekly_status", sa.Column("weekly_update", sa.Text(), nullable=True))
    op.add_column("weekly_status", sa.Column("update_date", sa.Date(), nullable=True))
    op.add_column("weekly_status", sa.Column("delivery_lead", sa.String(length=255), nullable=True))

    op.execute("UPDATE weekly_status SET weekly_update = key_flag_comment WHERE weekly_update IS NULL")
    op.execute("UPDATE weekly_status SET update_date = week_ending WHERE update_date IS NULL")
    op.execute("UPDATE weekly_status SET delivery_lead = 'PM' WHERE delivery_lead IS NULL")

    op.alter_column("weekly_status", "update_date", nullable=False)
    op.alter_column("weekly_status", "delivery_lead", nullable=False)
    op.drop_column("weekly_status", "key_flag_comment")


def downgrade() -> None:
    op.add_column("weekly_status", sa.Column("key_flag_comment", sa.Text(), nullable=True))
    op.execute("UPDATE weekly_status SET key_flag_comment = weekly_update WHERE key_flag_comment IS NULL")
    op.drop_column("weekly_status", "delivery_lead")
    op.drop_column("weekly_status", "update_date")
    op.drop_column("weekly_status", "weekly_update")

    op.drop_column("projects", "current_milestone_status")
    op.drop_column("projects", "current_milestone_due")
    op.drop_column("projects", "current_milestone")
