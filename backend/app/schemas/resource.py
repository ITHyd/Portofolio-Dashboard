from datetime import date, datetime
from pydantic import BaseModel


class ResourceBase(BaseModel):
    code: str | None = None
    name: str
    practice: str | None = None
    region: str | None = None
    contract_hours_per_week: float | None = None
    active: bool = True


class ResourceCreate(ResourceBase):
    pass


class ResourceOut(ResourceBase):
    id: int

    class Config:
        from_attributes = True


class ResourceWeekBase(BaseModel):
    resource_id: int
    week_ending: date
    leave_hrs: float | None = None
    billable_hrs: float | None = None
    non_billable_hrs: float | None = None
    utilisation_pct: float | None = None
    assigned_project_refs: str | None = None
    assignment_status: str | None = None
    notes: str | None = None


class ResourceWeekCreate(ResourceWeekBase):
    pass


class ResourceWeekOut(ResourceWeekBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
