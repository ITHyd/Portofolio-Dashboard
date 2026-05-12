from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_roles
from app.database import get_db
from app.models import GovCheckpoint, User
from app.schemas.gov_checkpoint import (
    GovCheckpointCreate,
    GovCheckpointOut,
    GovCheckpointUpdate,
)

router = APIRouter(prefix="/api/gov-checkpoints", tags=["gov-checkpoints"])


@router.get("", response_model=list[GovCheckpointOut])
def list_items(
    project_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(GovCheckpoint)
    if project_id:
        q = q.where(GovCheckpoint.project_id == project_id)
    return db.scalars(q.order_by(GovCheckpoint.project_id, GovCheckpoint.checkpoint_code)).all()


@router.post("", response_model=GovCheckpointOut, status_code=201)
def create_item(
    payload: GovCheckpointCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("portfolio_office")),
):
    row = GovCheckpoint(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{item_id}", response_model=GovCheckpointOut)
def update_item(
    item_id: int,
    payload: GovCheckpointUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("portfolio_office")),
):
    row = db.get(GovCheckpoint, item_id)
    if not row:
        raise HTTPException(404, "Not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    if data.get("status") == "Complete" and row.signed_off_at is None:
        row.signed_off_at = datetime.now(timezone.utc)
        row.signed_off_by_user_id = user.id
    db.commit()
    db.refresh(row)
    return row
