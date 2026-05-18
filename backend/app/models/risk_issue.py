from datetime import date, datetime
from sqlalchemy import String, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RiskIssue(Base):
    __tablename__ = "risk_issues"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    type: Mapped[str | None] = mapped_column(String(32))  # Risk | Issue
    rating: Mapped[str | None] = mapped_column(String(32))  # Low | Medium | High
    description: Mapped[str | None] = mapped_column(Text)
    impact_if_unmitigated: Mapped[str | None] = mapped_column(Text)
    mitigation_action: Mapped[str | None] = mapped_column(Text)
    owner: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str | None] = mapped_column(String(32), index=True)  # Open | In Progress | Closed
    date_raised: Mapped[date | None] = mapped_column(Date)
    date_closed: Mapped[date | None] = mapped_column(Date)
    weekly_status_id: Mapped[int | None] = mapped_column(
        ForeignKey("weekly_status.id", ondelete="SET NULL"), unique=True
    )
    escalation_kind: Mapped[str | None] = mapped_column(String(32))  # Escalation | Decision Required
    linked_escalation_id: Mapped[int | None] = mapped_column(
        ForeignKey("escalations_decisions.id", ondelete="SET NULL"), unique=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
