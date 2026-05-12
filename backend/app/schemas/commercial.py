from datetime import date, datetime
from pydantic import BaseModel


class CommercialBase(BaseModel):
    project_id: int
    period_month: date
    contract_value_gbp: float | None = None
    revenue_plan_mtd: float | None = None
    revenue_actual_mtd: float | None = None
    margin_forecast_pct: float | None = None
    opportunity_name: str | None = None
    pipeline_stage: str | None = None
    pipeline_value_gbp: float | None = None
    repeat_or_new: str | None = None


class CommercialCreate(CommercialBase):
    pass


class CommercialOut(CommercialBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
