from datetime import date, datetime
from pydantic import BaseModel, model_validator


RAG_VALUES = {"Green", "Amber", "Red"}


class WeeklyStatusBase(BaseModel):
    project_id: int
    week_ending: date
    schedule_rag: str | None = None
    resource_rag: str | None = None
    scope_rag: str | None = None
    budget_rag: str | None = None
    overall_rag: str | None = None
    key_flag_comment: str | None = None
    next_milestone: str | None = None
    milestone_due: date | None = None
    milestone_status: str | None = None

    @model_validator(mode="after")
    def check_red_has_comment(self):
        rags = [self.schedule_rag, self.resource_rag, self.scope_rag, self.budget_rag, self.overall_rag]
        if "Red" in rags and not (self.key_flag_comment and self.key_flag_comment.strip()):
            raise ValueError("Red RAG requires a Key Flag / Comment")
        for v in rags:
            if v is not None and v not in RAG_VALUES:
                raise ValueError(f"Invalid RAG value: {v}")
        return self


class WeeklyStatusCreate(WeeklyStatusBase):
    pass


class WeeklyStatusOut(WeeklyStatusBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
