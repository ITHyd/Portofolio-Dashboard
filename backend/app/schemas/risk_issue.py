from datetime import date, datetime
from pydantic import BaseModel


class RiskIssueBase(BaseModel):
    project_id: int
    type: str | None = None
    rating: str | None = None
    description: str | None = None
    impact_if_unmitigated: str | None = None
    mitigation_action: str | None = None
    owner: str | None = None
    status: str | None = "Open"
    date_raised: date | None = None
    date_closed: date | None = None


class RiskIssueCreate(RiskIssueBase):
    pass


class RiskIssueUpdate(RiskIssueBase):
    project_id: int | None = None


class RiskIssueOut(RiskIssueBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
