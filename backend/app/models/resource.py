from datetime import date, datetime
from sqlalchemy import String, Date, DateTime, ForeignKey, Numeric, Boolean, UniqueConstraint, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str | None] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    practice: Mapped[str | None] = mapped_column(String(64), index=True)
    region: Mapped[str | None] = mapped_column(String(32), index=True)  # UK | India
    contract_hours_per_week: Mapped[float | None] = mapped_column(Numeric(5, 2))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ResourceWeek(Base):
    __tablename__ = "resource_weeks"
    __table_args__ = (UniqueConstraint("resource_id", "week_ending", name="uq_resource_week"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), index=True)
    week_ending: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    leave_hrs: Mapped[float | None] = mapped_column(Numeric(5, 2))
    billable_hrs: Mapped[float | None] = mapped_column(Numeric(5, 2))
    non_billable_hrs: Mapped[float | None] = mapped_column(Numeric(5, 2))
    utilisation_pct: Mapped[float | None] = mapped_column(Numeric(5, 4))
    assigned_project_refs: Mapped[str | None] = mapped_column(String(255))
    assignment_status: Mapped[str | None] = mapped_column(String(32))  # Assigned | Part-assigned | Bench
    notes: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
