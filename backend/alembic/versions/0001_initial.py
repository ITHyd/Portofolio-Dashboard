"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-12

"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ref", sa.String(64), unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("client", sa.String(255), nullable=False),
        sa.Column("sub_proposition", sa.String(128)),
        sa.Column("phase", sa.String(64)),
        sa.Column("status", sa.String(32), nullable=False, server_default="Active"),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date_baseline", sa.Date()),
        sa.Column("end_date_forecast", sa.Date()),
        sa.Column("days_slippage", sa.Integer()),
        sa.Column("contract_value_gbp", sa.Numeric(14, 2)),
        sa.Column("margin_target_pct", sa.Numeric(5, 2)),
        sa.Column("pm_user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("cp_user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("pm_name", sa.String(255)),
        sa.Column("cp_name", sa.String(255)),
        sa.Column("project_code", sa.String(64)),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_projects_ref", "projects", ["ref"])
    op.create_index("ix_projects_client", "projects", ["client"])
    op.create_index("ix_projects_status", "projects", ["status"])

    op.create_table(
        "weekly_status",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("week_ending", sa.Date(), nullable=False),
        sa.Column("schedule_rag", sa.String(16)),
        sa.Column("resource_rag", sa.String(16)),
        sa.Column("scope_rag", sa.String(16)),
        sa.Column("budget_rag", sa.String(16)),
        sa.Column("overall_rag", sa.String(16)),
        sa.Column("key_flag_comment", sa.Text()),
        sa.Column("next_milestone", sa.String(255)),
        sa.Column("milestone_due", sa.Date()),
        sa.Column("milestone_status", sa.String(32)),
        sa.Column("updated_by_user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "week_ending", name="uq_weekly_status_project_week"),
    )
    op.create_index("ix_weekly_status_week_ending", "weekly_status", ["week_ending"])

    op.create_table(
        "risk_issues",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(32)),
        sa.Column("rating", sa.String(32)),
        sa.Column("description", sa.Text()),
        sa.Column("impact_if_unmitigated", sa.Text()),
        sa.Column("mitigation_action", sa.Text()),
        sa.Column("owner", sa.String(255)),
        sa.Column("status", sa.String(32)),
        sa.Column("date_raised", sa.Date()),
        sa.Column("date_closed", sa.Date()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_risk_issues_status", "risk_issues", ["status"])

    op.create_table(
        "escalations_decisions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("week_ending", sa.Date(), nullable=False),
        sa.Column("kind", sa.String(32), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("severity", sa.String(16)),
        sa.Column("raised_by_user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("owner", sa.String(255)),
        sa.Column("status", sa.String(32), nullable=False, server_default="Open"),
        sa.Column("resolution", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_escalations_status", "escalations_decisions", ["status"])

    op.create_table(
        "commercial",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("period_month", sa.Date(), nullable=False),
        sa.Column("contract_value_gbp", sa.Numeric(14, 2)),
        sa.Column("revenue_plan_mtd", sa.Numeric(14, 2)),
        sa.Column("revenue_actual_mtd", sa.Numeric(14, 2)),
        sa.Column("margin_forecast_pct", sa.Numeric(5, 2)),
        sa.Column("opportunity_name", sa.String(255)),
        sa.Column("pipeline_stage", sa.String(64)),
        sa.Column("pipeline_value_gbp", sa.Numeric(14, 2)),
        sa.Column("repeat_or_new", sa.String(16)),
        sa.Column("updated_by_user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "period_month", name="uq_commercial_project_month"),
    )

    op.create_table(
        "resources",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(32), unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("practice", sa.String(64)),
        sa.Column("region", sa.String(32)),
        sa.Column("contract_hours_per_week", sa.Numeric(5, 2)),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "resource_weeks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("resource_id", sa.Integer(), sa.ForeignKey("resources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("week_ending", sa.Date(), nullable=False),
        sa.Column("leave_hrs", sa.Numeric(5, 2)),
        sa.Column("billable_hrs", sa.Numeric(5, 2)),
        sa.Column("non_billable_hrs", sa.Numeric(5, 2)),
        sa.Column("utilisation_pct", sa.Numeric(5, 4)),
        sa.Column("assigned_project_refs", sa.String(255)),
        sa.Column("assignment_status", sa.String(32)),
        sa.Column("notes", sa.Text()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("resource_id", "week_ending", name="uq_resource_week"),
    )

    op.create_table(
        "csat",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date_collected", sa.Date()),
        sa.Column("score_1_5", sa.Integer()),
        sa.Column("comment", sa.Text()),
        sa.Column("collected_by_user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("collected_by_name", sa.String(255)),
        sa.Column("next_collection_due", sa.Date()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "gov_checkpoints",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("checkpoint_code", sa.String(8), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="Not Started"),
        sa.Column("evidence_url", sa.String(512)),
        sa.Column("signed_off_by_user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("signed_off_at", sa.DateTime(timezone=True)),
        sa.Column("notes", sa.Text()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "checkpoint_code", name="uq_gov_checkpoint_project_code"),
    )

    op.create_table(
        "metric_definitions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("metric_number", sa.Integer(), unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(64)),
        sa.Column("sub_category", sa.String(128)),
        sa.Column("release", sa.String(16), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("formula", sa.Text()),
        sa.Column("unit", sa.String(64)),
        sa.Column("update_frequency", sa.String(64)),
        sa.Column("data_owner", sa.String(128)),
    )
    op.create_index("ix_metric_definitions_release", "metric_definitions", ["release"])

    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("action", sa.String(32), nullable=False),
        sa.Column("entity", sa.String(64), nullable=False),
        sa.Column("entity_id", sa.Integer()),
        sa.Column("before_json", sa.JSON()),
        sa.Column("after_json", sa.JSON()),
        sa.Column("at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_audit_log_at", "audit_log", ["at"])


def downgrade() -> None:
    op.drop_table("audit_log")
    op.drop_table("metric_definitions")
    op.drop_table("gov_checkpoints")
    op.drop_table("csat")
    op.drop_table("resource_weeks")
    op.drop_table("resources")
    op.drop_table("commercial")
    op.drop_table("escalations_decisions")
    op.drop_table("risk_issues")
    op.drop_table("weekly_status")
    op.drop_table("projects")
    op.drop_table("users")
