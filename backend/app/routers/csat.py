from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_roles
from app.database import get_db
from app.models import Csat, User
from app.schemas.csat import CsatCreate, CsatOut

router = APIRouter(prefix="/api/csat", tags=["csat"])


@router.get("", response_model=list[CsatOut])
def list_items(
    project_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(Csat)
    if project_id:
        q = q.where(Csat.project_id == project_id)
    return db.scalars(q.order_by(Csat.date_collected.desc())).all()


@router.post("", response_model=CsatOut, status_code=201)
def create_item(
    payload: CsatCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("cp")),
):
    row = Csat(**payload.model_dump(), collected_by_user_id=user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
