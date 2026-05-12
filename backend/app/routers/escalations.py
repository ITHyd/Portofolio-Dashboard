from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_roles
from app.database import get_db
from app.models import EscalationDecision, User
from app.schemas.escalation import EscalationCreate, EscalationOut, EscalationUpdate

router = APIRouter(prefix="/api/escalations", tags=["escalations"])


@router.get("", response_model=list[EscalationOut])
def list_items(
    project_id: int | None = Query(None),
    week_ending: date | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(EscalationDecision)
    if project_id:
        q = q.where(EscalationDecision.project_id == project_id)
    if week_ending:
        q = q.where(EscalationDecision.week_ending == week_ending)
    if status:
        q = q.where(EscalationDecision.status == status)
    return db.scalars(q.order_by(EscalationDecision.created_at.desc())).all()


@router.post("", response_model=EscalationOut, status_code=201)
def create_item(
    payload: EscalationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("pm")),
):
    row = EscalationDecision(**payload.model_dump(), raised_by_user_id=user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{item_id}", response_model=EscalationOut)
def update_item(
    item_id: int,
    payload: EscalationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("pm", "portfolio_office")),
):
    row = db.get(EscalationDecision, item_id)
    if not row:
        raise HTTPException(404, "Not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    if data.get("status") == "Closed" and row.resolved_at is None:
        row.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return row
