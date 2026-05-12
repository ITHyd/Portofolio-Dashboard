from datetime import date, datetime
from sqlalchemy import String, Date, DateTime, ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Commercial(Base):
    __tablename__ = "commercial"
    __table_args__ = (UniqueConstraint("project_id", "period_month", name="uq_commercial_project_month"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    period_month: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    contract_value_gbp: Mapped[float | None] = mapped_column(Numeric(14, 2))
    revenue_plan_mtd: Mapped[float | None] = mapped_column(Numeric(14, 2))
    revenue_actual_mtd: Mapped[float | None] = mapped_column(Numeric(14, 2))
    margin_forecast_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    opportunity_name: Mapped[str | None] = mapped_column(String(255))
    pipeline_stage: Mapped[str | None] = mapped_column(String(64))
    pipeline_value_gbp: Mapped[float | None] = mapped_column(Numeric(14, 2))
    repeat_or_new: Mapped[str | None] = mapped_column(String(16))
    updated_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
