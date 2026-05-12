from datetime import date, datetime
from pydantic import BaseModel


class CsatBase(BaseModel):
    project_id: int
    date_collected: date | None = None
    score_1_5: int | None = None
    comment: str | None = None
    collected_by_name: str | None = None
    next_collection_due: date | None = None


class CsatCreate(CsatBase):
    pass


class CsatOut(CsatBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
