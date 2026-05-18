from datetime import date, datetime
from pydantic import BaseModel, model_validator


RISK_RATINGS = {"Low", "Medium", "High"}
RISK_TYPES = {"Risk", "Issue"}
ESCALATION_KINDS = {"Escalation", "Decision Required"}


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
    weekly_status_id: int | None = None
    escalation_kind: str | None = None
    linked_escalation_id: int | None = None

    @model_validator(mode="after")
    def validate_values(self):
        if self.rating == "Very High":
            self.rating = "High"
        if self.rating is not None and self.rating not in RISK_RATINGS:
            raise ValueError("Rating must be Low, Medium, or High")
        if self.type is not None and self.type not in RISK_TYPES:
            raise ValueError("Type must be Risk or Issue")
        if self.escalation_kind is not None and self.escalation_kind not in ESCALATION_KINDS:
            raise ValueError("Escalation kind must be Escalation or Decision Required")
        return self


class RiskIssueCreate(RiskIssueBase):
    pass


class RiskIssueUpdate(RiskIssueBase):
    project_id: int | None = None


class RiskIssueOut(RiskIssueBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
