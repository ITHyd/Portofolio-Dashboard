from datetime import date, datetime
from pydantic import BaseModel


class ProjectBase(BaseModel):
    ref: str | None = None
    name: str
    client: str
    sub_proposition: str | None = None
    phase: str | None = None
    status: str = "Active"
    start_date: date | None = None
    end_date_baseline: date | None = None
    end_date_forecast: date | None = None
    days_slippage: int | None = None
    contract_value_gbp: float | None = None
    margin_target_pct: float | None = None
    pm_name: str | None = None
    cp_name: str | None = None
    current_milestone: str | None = None
    current_milestone_due: date | None = None
    current_milestone_status: str | None = None
    project_code: str | None = None
    notes: str | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    name: str | None = None
    client: str | None = None
    status: str | None = None


class ProjectOut(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
