from datetime import datetime
from pydantic import BaseModel, model_validator


class GovCheckpointBase(BaseModel):
    project_id: int
    checkpoint_code: str  # B1..C4
    status: str = "Not Started"
    evidence_url: str | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def normalize_status(self):
        if self.status == "Complete":
            self.status = "Completed"
        return self


class GovCheckpointCreate(GovCheckpointBase):
    pass


class GovCheckpointUpdate(BaseModel):
    status: str | None = None
    evidence_url: str | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def normalize_status(self):
        if self.status == "Complete":
            self.status = "Completed"
        return self


class GovCheckpointOut(GovCheckpointBase):
    id: int
    signed_off_at: datetime | None
    updated_at: datetime

    class Config:
        from_attributes = True
