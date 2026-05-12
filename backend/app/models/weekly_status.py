from datetime import date, datetime
from sqlalchemy import String, Date, DateTime, ForeignKey, UniqueConstraint, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WeeklyStatus(Base):
    __tablename__ = "weekly_status"
    __table_args__ = (UniqueConstraint("project_id", "week_ending", name="uq_weekly_status_project_week"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    week_ending: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    schedule_rag: Mapped[str | None] = mapped_column(String(16))
    resource_rag: Mapped[str | None] = mapped_column(String(16))
    scope_rag: Mapped[str | None] = mapped_column(String(16))
    budget_rag: Mapped[str | None] = mapped_column(String(16))
    overall_rag: Mapped[str | None] = mapped_column(String(16))
    key_flag_comment: Mapped[str | None] = mapped_column(Text)
    next_milestone: Mapped[str | None] = mapped_column(String(255))
    milestone_due: Mapped[date | None] = mapped_column(Date)
    milestone_status: Mapped[str | None] = mapped_column(String(32))
    updated_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
