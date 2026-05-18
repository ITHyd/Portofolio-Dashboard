from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_roles
from app.database import get_db
from app.models import RiskIssue, User
from app.schemas.risk_issue import RiskIssueCreate, RiskIssueOut, RiskIssueUpdate
from app.services.delivery_sync import sync_escalation_for_risk, sync_weekly_status_for_risk

router = APIRouter(prefix="/api/risks-issues", tags=["risks-issues"])


def _apply_escalation_status_rules(data: dict) -> None:
    escalation_kind = data.get("escalation_kind")
    if escalation_kind == "Escalation":
        data["status"] = "Open"
        data["date_closed"] = None
    elif escalation_kind == "Decision Required":
        data["status"] = "In Progress"
        data["date_closed"] = None


@router.get("", response_model=list[RiskIssueOut])
def list_items(
    project_id: int | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(RiskIssue)
    if project_id:
        q = q.where(RiskIssue.project_id == project_id)
    if status:
        q = q.where(RiskIssue.status == status)
    return db.scalars(q.order_by(RiskIssue.date_raised.desc())).all()


@router.post("", response_model=RiskIssueOut, status_code=201)
def create_item(
    payload: RiskIssueCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("pm")),
):
    data = payload.model_dump()
    _apply_escalation_status_rules(data)
    if data.get("status") == "Closed" and not data.get("date_closed"):
        data["date_closed"] = date.today()
    row = RiskIssue(**data)
    db.add(row)
    db.flush()
    sync_escalation_for_risk(db, row)
    sync_weekly_status_for_risk(db, row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{item_id}", response_model=RiskIssueOut)
def update_item(
    item_id: int,
    payload: RiskIssueUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("pm")),
):
    row = db.get(RiskIssue, item_id)
    if not row:
        raise HTTPException(404, "Not found")
    data = payload.model_dump(exclude_unset=True)
    _apply_escalation_status_rules(data)
    if data.get("status") == "Closed" and not data.get("date_closed"):
        data["date_closed"] = date.today()
    elif data.get("status") and data.get("status") != "Closed":
        data["date_closed"] = None
    for k, v in data.items():
        setattr(row, k, v)
    sync_escalation_for_risk(db, row)
    sync_weekly_status_for_risk(db, row)
    db.commit()
    db.refresh(row)
    return row
