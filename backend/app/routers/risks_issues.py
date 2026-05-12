from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_roles
from app.database import get_db
from app.models import RiskIssue, User
from app.schemas.risk_issue import RiskIssueCreate, RiskIssueOut, RiskIssueUpdate

router = APIRouter(prefix="/api/risks-issues", tags=["risks-issues"])


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
    row = RiskIssue(**payload.model_dump())
    db.add(row)
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
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row
