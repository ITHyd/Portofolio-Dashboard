from collections import defaultdict
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.database import get_db
from app.models import (
    EscalationDecision,
    GovCheckpoint,
    Project,
    Resource,
    ResourceWeek,
    RiskIssue,
    User,
    WeeklyStatus,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _latest_status_week(db: Session) -> date | None:
    return db.scalar(select(func.max(WeeklyStatus.week_ending)))


def _latest_resource_week(db: Session) -> date | None:
    return db.scalar(select(func.max(ResourceWeek.week_ending)))


def _latest_status_per_project(db: Session) -> dict[int, WeeklyStatus]:
    """Most recent WeeklyStatus row for each project (regardless of which week)."""
    sub = (
        select(WeeklyStatus.project_id, func.max(WeeklyStatus.week_ending).label("max_w"))
        .group_by(WeeklyStatus.project_id)
        .subquery()
    )
    rows = db.scalars(
        select(WeeklyStatus).join(
            sub,
            (WeeklyStatus.project_id == sub.c.project_id)
            & (WeeklyStatus.week_ending == sub.c.max_w),
        )
    ).all()
    return {r.project_id: r for r in rows}


def _rag_pct(rows: list[WeeklyStatus]):
    if not rows:
        return {"green": 0.0, "amber": 0.0, "red": 0.0, "counts": {"green": 0, "amber": 0, "red": 0}}
    counts = {"green": 0, "amber": 0, "red": 0}
    for r in rows:
        if r.overall_rag == "Green":
            counts["green"] += 1
        elif r.overall_rag == "Amber":
            counts["amber"] += 1
        elif r.overall_rag == "Red":
            counts["red"] += 1
    total = sum(counts.values()) or 1
    return {
        "green": round(counts["green"] * 100 / total, 1),
        "amber": round(counts["amber"] * 100 / total, 1),
        "red": round(counts["red"] * 100 / total, 1),
        "counts": counts,
    }


def _overall_portfolio_rag(rag_mix: dict) -> str:
    if rag_mix["red"] >= 10:
        return "Red"
    if rag_mix["red"] >= 1 or rag_mix["amber"] >= 20:
        return "Amber"
    return "Green"


@router.get("/summary")
def summary(
    week_ending: date | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    status_week = week_ending or _latest_status_week(db) or date.today()
    resource_week = _latest_resource_week(db)

    active_projects = db.scalars(select(Project).where(Project.status == "Active")).all()
    active_clients = {p.client for p in active_projects}

    # Project health: take the latest WeeklyStatus row per project, so a single
    # project updating doesn't zero out everyone else.
    latest_per_project = _latest_status_per_project(db)
    status_for_active = [latest_per_project[p.id] for p in active_projects if p.id in latest_per_project]

    rag_mix = _rag_pct(status_for_active)
    portfolio_rag = _overall_portfolio_rag(rag_mix)

    schedule_total = sum(1 for s in status_for_active if s.schedule_rag)
    schedule_green = sum(1 for s in status_for_active if s.schedule_rag == "Green")
    on_time_pct = round(schedule_green * 100 / schedule_total, 1) if schedule_total else 0.0
    behind = sum(1 for s in status_for_active if s.schedule_rag == "Red")

    resource_gaps = sum(1 for s in status_for_active if s.resource_rag in ("Amber", "Red"))

    # Resource utilisation: keyed off the latest resource_week, independent of status_week.
    resources = db.scalars(select(Resource).where(Resource.active == True)).all()
    rw_rows: list[ResourceWeek] = []
    if resource_week:
        rw_rows = db.scalars(
            select(ResourceWeek).where(ResourceWeek.week_ending == resource_week)
        ).all()
    rw_by_id = {r.resource_id: r for r in rw_rows}

    def _util_avg(region: str) -> float:
        vals = []
        for r in resources:
            if r.region == region:
                rw = rw_by_id.get(r.id)
                if rw and rw.utilisation_pct is not None:
                    vals.append(float(rw.utilisation_pct))
        return round(sum(vals) * 100 / len(vals), 1) if vals else 0.0

    util_uk = _util_avg("UK")
    util_india = _util_avg("India")

    unassigned_count = sum(
        1
        for r in resources
        if (rw_by_id.get(r.id) and rw_by_id[r.id].assignment_status == "Bench")
    )
    unassigned_pct = round(unassigned_count * 100 / len(resources), 1) if resources else 0.0

    total_hrs = 0.0
    non_billable_hrs = 0.0
    billable_hrs = 0.0
    for rw in rw_rows:
        b = float(rw.billable_hrs or 0)
        nb = float(rw.non_billable_hrs or 0)
        total_hrs += b + nb
        billable_hrs += b
        non_billable_hrs += nb
    unbillable_pct = round(non_billable_hrs * 100 / total_hrs, 1) if total_hrs else 0.0
    billable_util_pct = round(billable_hrs * 100 / total_hrs, 1) if total_hrs else 0.0

    open_risks = (
        db.scalar(
            select(func.count())
            .select_from(RiskIssue)
            .where(RiskIssue.type == "Risk", RiskIssue.status != "Closed")
        )
        or 0
    )
    open_issues = (
        db.scalar(
            select(func.count())
            .select_from(RiskIssue)
            .where(RiskIssue.type == "Issue", RiskIssue.status != "Closed")
        )
        or 0
    )

    open_escalations = (
        db.scalar(
            select(func.count())
            .select_from(EscalationDecision)
            .where(EscalationDecision.status == "Open")
        )
        or 0
    )

    # 8-week trend uses status_week as the anchor; latest-per-project semantics don't apply here
    # (we want per-week portfolio mix, even if some projects didn't update that week).
    weeks_back = [status_week - timedelta(weeks=i) for i in range(7, -1, -1)]
    history = db.scalars(
        select(WeeklyStatus).where(WeeklyStatus.week_ending.in_(weeks_back))
    ).all()
    by_week: dict[date, list[WeeklyStatus]] = defaultdict(list)
    for r in history:
        by_week[r.week_ending].append(r)
    trend = []
    for w in weeks_back:
        mix = _rag_pct(by_week.get(w, []))
        wk_rows = by_week.get(w, [])
        schedule_rows = [s for s in wk_rows if s.schedule_rag]
        trend.append(
            {
                "week_ending": w.isoformat(),
                "green_pct": mix["green"],
                "amber_pct": mix["amber"],
                "red_pct": mix["red"],
                "on_time_pct": round(
                    sum(1 for s in schedule_rows if s.schedule_rag == "Green")
                    * 100
                    / len(schedule_rows),
                    1,
                )
                if schedule_rows
                else 0.0,
            }
        )

    project_health = []
    for p in active_projects:
        s = latest_per_project.get(p.id)
        project_health.append(
            {
                "project_id": p.id,
                "ref": p.ref,
                "name": p.name,
                "client": p.client,
                "phase": p.phase,
                "schedule_rag": s.schedule_rag if s else None,
                "resource_rag": s.resource_rag if s else None,
                "scope_rag": s.scope_rag if s else None,
                "budget_rag": s.budget_rag if s else None,
                "overall_rag": s.overall_rag if s else None,
                "key_flag_comment": s.key_flag_comment if s else None,
                "next_milestone": s.next_milestone if s else None,
                "milestone_due": s.milestone_due.isoformat() if s and s.milestone_due else None,
                "milestone_status": s.milestone_status if s else None,
                "last_updated_week": s.week_ending.isoformat() if s else None,
            }
        )

    return {
        "week_ending": status_week.isoformat(),
        "resource_week_ending": resource_week.isoformat() if resource_week else None,
        "kpis": {
            "active_projects": len(active_projects),
            "active_clients": len(active_clients),
            "overall_rag": portfolio_rag,
            "rag_mix": rag_mix,
            "on_time_pct": on_time_pct,
            "projects_behind_schedule": behind,
            "resource_gaps_flagged": resource_gaps,
            "utilisation_uk": util_uk,
            "utilisation_india": util_india,
            "unassigned_pct": unassigned_pct,
            "unbillable_pct": unbillable_pct,
            "billable_utilisation": billable_util_pct,
            "open_risks": int(open_risks),
            "open_issues": int(open_issues),
            "open_escalations": int(open_escalations),
        },
        "trend": trend,
        "project_health": project_health,
    }


@router.get("/governance-heatmap")
def governance_heatmap(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.scalars(select(GovCheckpoint)).all()
    projects = db.scalars(select(Project).where(Project.status == "Active")).all()
    grid: dict[int, dict[str, str]] = defaultdict(dict)
    for r in rows:
        grid[r.project_id][r.checkpoint_code] = r.status
    return {
        "projects": [{"id": p.id, "ref": p.ref, "name": p.name, "client": p.client} for p in projects],
        "grid": {pid: cells for pid, cells in grid.items()},
    }
