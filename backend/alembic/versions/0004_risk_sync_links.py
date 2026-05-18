"""risk sync links and escalation bridge

Revision ID: 0004_risk_sync_links
Revises: 0003_weekly_status_reminders
Create Date: 2026-05-15

"""
from alembic import op
import sqlalchemy as sa


revision = "0004_risk_sync_links"
down_revision = "0003_weekly_status_reminders"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE risk_issues SET rating = 'High' WHERE rating = 'Very High'")

    op.add_column("risk_issues", sa.Column("weekly_status_id", sa.Integer(), nullable=True))
    op.add_column("risk_issues", sa.Column("escalation_kind", sa.String(length=32), nullable=True))
    op.add_column("risk_issues", sa.Column("linked_escalation_id", sa.Integer(), nullable=True))

    op.create_foreign_key(
        "fk_risk_issues_weekly_status_id",
        "risk_issues",
        "weekly_status",
        ["weekly_status_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_risk_issues_linked_escalation_id",
        "risk_issues",
        "escalations_decisions",
        ["linked_escalation_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_unique_constraint(
        "uq_risk_issues_weekly_status_id",
        "risk_issues",
        ["weekly_status_id"],
    )
    op.create_unique_constraint(
        "uq_risk_issues_linked_escalation_id",
        "risk_issues",
        ["linked_escalation_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_risk_issues_linked_escalation_id", "risk_issues", type_="unique")
    op.drop_constraint("uq_risk_issues_weekly_status_id", "risk_issues", type_="unique")
    op.drop_constraint("fk_risk_issues_linked_escalation_id", "risk_issues", type_="foreignkey")
    op.drop_constraint("fk_risk_issues_weekly_status_id", "risk_issues", type_="foreignkey")
    op.drop_column("risk_issues", "linked_escalation_id")
    op.drop_column("risk_issues", "escalation_kind")
    op.drop_column("risk_issues", "weekly_status_id")
