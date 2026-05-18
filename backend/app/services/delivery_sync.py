from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import EscalationDecision, Project, RiskIssue, WeeklyStatus


def _risk_title(risk: RiskIssue) -> str:
    summary = (risk.description or f"{risk.type or 'Risk'} for project {risk.project_id}").strip()
    prefix = "Escalation" if risk.escalation_kind == "Escalation" else "Decision Required"
    title = f"{prefix}: {summary}"
    return title[:255]


def _status_for_escalation_kind(kind: str | None) -> str:
    return "Open" if kind == "Escalation" else "In Progress"


def weekly_overall_to_risk_state(overall_rag: str | None) -> tuple[str | None, str | None, str | None]:
    if overall_rag == "Red":
        return "Issue", "High", "Open"
    if overall_rag == "Amber":
        return "Risk", "Medium", "Open"
    if overall_rag == "Green":
        return None, None, "Closed"
    return None, None, None


def risk_to_weekly_overall(risk: RiskIssue) -> str:
    if risk.status == "Closed":
        return "Green"
    if risk.rating == "High":
        return "Red"
    if risk.rating == "Medium":
        return "Amber"
    return "Green"


def sync_escalation_for_risk(db: Session, risk: RiskIssue) -> EscalationDecision | None:
    linked = db.get(EscalationDecision, risk.linked_escalation_id) if risk.linked_escalation_id else None

    if not risk.escalation_kind or risk.status == "Closed":
        # Close the linked escalation if the risk is no longer flagged for escalation flow
        # or if the parent risk/issue itself has been closed.
        if linked and linked.status != "Closed":
            linked.status = "Closed"
            linked.resolved_at = datetime.now(timezone.utc)
        risk.linked_escalation_id = linked.id if linked else None
        return linked

    weekly = db.get(WeeklyStatus, risk.weekly_status_id) if risk.weekly_status_id else None
    week_ending = weekly.week_ending if weekly else (risk.date_raised or date.today())
    status = _status_for_escalation_kind(risk.escalation_kind)

    if linked is None:
        linked = EscalationDecision(
            project_id=risk.project_id,
            week_ending=week_ending,
            kind=risk.escalation_kind,
            title=_risk_title(risk),
            description=risk.description,
            severity=risk.rating,
            owner=risk.owner,
            status=status,
        )
        db.add(linked)
        db.flush()
        risk.linked_escalation_id = linked.id
        return linked

    linked.project_id = risk.project_id
    linked.week_ending = week_ending
    linked.kind = risk.escalation_kind
    linked.title = _risk_title(risk)
    linked.description = risk.description
    linked.severity = risk.rating
    linked.owner = risk.owner
    linked.status = status
    if status != "Closed":
        linked.resolved_at = None
    return linked


def sync_weekly_status_for_risk(db: Session, risk: RiskIssue) -> WeeklyStatus | None:
    if not risk.weekly_status_id:
        return None
    weekly = db.get(WeeklyStatus, risk.weekly_status_id)
    if weekly is None:
        return None

    weekly.overall_rag = risk_to_weekly_overall(risk)
    return weekly


def sync_risk_for_weekly_status(db: Session, weekly: WeeklyStatus, project: Project) -> RiskIssue | None:
    linked = db.scalar(
        select(RiskIssue).where(RiskIssue.weekly_status_id == weekly.id)
    )
    issue_type, rating, status = weekly_overall_to_risk_state(weekly.overall_rag)

    if status is None:
        return linked

    if linked is None and weekly.overall_rag in {"Amber", "Red"}:
        linked = RiskIssue(
            project_id=weekly.project_id,
            weekly_status_id=weekly.id,
            type=issue_type,
            rating=rating,
            description=(weekly.weekly_update or f"Auto-created from weekly status {weekly.overall_rag} for {project.name}").strip(),
            owner=weekly.delivery_lead or project.pm_name,
            status=status,
            date_raised=weekly.update_date or weekly.week_ending,
        )
        db.add(linked)
        db.flush()
        return linked

    if linked is None:
        return None

    if weekly.overall_rag == "Green":
        linked.type = "Risk"
        linked.rating = "Low"
        linked.status = "Closed"
        linked.date_closed = weekly.update_date or date.today()
    else:
        linked.type = issue_type
        linked.rating = rating
        linked.status = status
        linked.date_closed = None
        linked.owner = weekly.delivery_lead or project.pm_name
        linked.date_raised = weekly.update_date or weekly.week_ending
        if weekly.weekly_update and weekly.weekly_update.strip():
            linked.description = weekly.weekly_update.strip()

    sync_escalation_for_risk(db, linked)
    return linked
