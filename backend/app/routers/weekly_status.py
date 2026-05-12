from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_roles
from app.database import get_db
from app.models import WeeklyStatus, User
from app.schemas.weekly_status import WeeklyStatusCreate, WeeklyStatusOut

router = APIRouter(prefix="/api/weekly-status", tags=["weekly-status"])


@router.get("", response_model=list[WeeklyStatusOut])
def list_weekly_status(
    week_ending: date | None = Query(None),
    project_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(WeeklyStatus)
    if week_ending:
        q = q.where(WeeklyStatus.week_ending == week_ending)
    if project_id:
        q = q.where(WeeklyStatus.project_id == project_id)
    return db.scalars(q.order_by(WeeklyStatus.week_ending.desc())).all()


@router.post("", response_model=WeeklyStatusOut, status_code=201)
def upsert_weekly_status(
    payload: WeeklyStatusCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("pm")),
):
    existing = db.scalar(
        select(WeeklyStatus).where(
            WeeklyStatus.project_id == payload.project_id,
            WeeklyStatus.week_ending == payload.week_ending,
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
    row = WeeklyStatus(**data, updated_by_user_id=user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/history/{project_id}", response_model=list[WeeklyStatusOut])
def project_history(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.scalars(
        select(WeeklyStatus)
        .where(WeeklyStatus.project_id == project_id)
        .order_by(WeeklyStatus.week_ending.asc())
    ).all()
