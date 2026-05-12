from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.database import get_db
from app.models import MetricDefinition, User

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("")
def list_metric_definitions(
    release: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(MetricDefinition).order_by(MetricDefinition.metric_number)
    if release:
        q = q.where(MetricDefinition.release == release)
    rows = db.scalars(q).all()
    return [
        {
            "id": r.id,
            "metric_number": r.metric_number,
            "name": r.name,
            "category": r.category,
            "sub_category": r.sub_category,
            "release": r.release,
            "description": r.description,
            "formula": r.formula,
            "unit": r.unit,
            "update_frequency": r.update_frequency,
            "data_owner": r.data_owner,
        }
        for r in rows
    ]
