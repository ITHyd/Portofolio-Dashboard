from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_roles
from app.database import get_db
from app.models import Resource, ResourceWeek, User
from app.schemas.resource import (
    ResourceCreate,
    ResourceOut,
    ResourceWeekCreate,
    ResourceWeekOut,
)

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.get("", response_model=list[ResourceOut])
def list_resources(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(Resource).order_by(Resource.name)).all()


@router.post("", response_model=ResourceOut, status_code=201)
def create_resource(
    payload: ResourceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("rm")),
):
    row = Resource(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/weeks", response_model=list[ResourceWeekOut])
def list_resource_weeks(
    week_ending: date | None = Query(None),
    resource_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(ResourceWeek)
    if week_ending:
        q = q.where(ResourceWeek.week_ending == week_ending)
    if resource_id:
        q = q.where(ResourceWeek.resource_id == resource_id)
    return db.scalars(q.order_by(ResourceWeek.week_ending.desc())).all()


@router.post("/weeks", response_model=ResourceWeekOut, status_code=201)
def upsert_resource_week(
    payload: ResourceWeekCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("rm")),
):
    existing = db.scalar(
        select(ResourceWeek).where(
            ResourceWeek.resource_id == payload.resource_id,
            ResourceWeek.week_ending == payload.week_ending,
        )
    )
    data = payload.model_dump()
    if existing:
        for k, v in data.items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    row = ResourceWeek(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
