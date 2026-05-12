from datetime import date, datetime
from pydantic import BaseModel


class EscalationBase(BaseModel):
    project_id: int
    week_ending: date
    kind: str  # Escalation | Decision Required
    title: str
    description: str | None = None
    severity: str | None = None
    owner: str | None = None
    status: str = "Open"
    resolution: str | None = None


class EscalationCreate(EscalationBase):
    pass


class EscalationUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: str | None = None
    owner: str | None = None
    status: str | None = None
    resolution: str | None = None


class EscalationOut(EscalationBase):
    id: int
    raised_by_user_id: int | None
    created_at: datetime
    resolved_at: datetime | None

    class Config:
        from_attributes = True
