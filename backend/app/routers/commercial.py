from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_roles
from app.database import get_db
from app.models import Commercial, User
from app.schemas.commercial import CommercialCreate, CommercialOut

router = APIRouter(prefix="/api/commercial", tags=["commercial"])


@router.get("", response_model=list[CommercialOut])
def list_items(
    project_id: int | None = Query(None),
    period_month: date | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(Commercial)
    if project_id:
        q = q.where(Commercial.project_id == project_id)
    if period_month:
        q = q.where(Commercial.period_month == period_month)
    return db.scalars(q.order_by(Commercial.period_month.desc())).all()


@router.post("", response_model=CommercialOut, status_code=201)
def upsert_item(
    payload: CommercialCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("cp", "finance")),
):
    existing = db.scalar(
        select(Commercial).where(
            Commercial.project_id == payload.project_id,
            Commercial.period_month == payload.period_month,
        )
    )
    data = payload.model_dump()
    if existing:
        for k, v in data.items():
            setattr(existing, k, v)
        existing.updated_by_user_id = user.id
        db.commit()
        db.refresh(existing)
        return existing
    row = Commercial(**data, updated_by_user_id=user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
