from datetime import date, datetime
from sqlalchemy import String, Integer, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    ref: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    client: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sub_proposition: Mapped[str | None] = mapped_column(String(128))
    phase: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False, index=True)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date_baseline: Mapped[date | None] = mapped_column(Date)
    end_date_forecast: Mapped[date | None] = mapped_column(Date)
    days_slippage: Mapped[int | None] = mapped_column(Integer)
    contract_value_gbp: Mapped[float | None] = mapped_column(Numeric(14, 2))
    margin_target_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    pm_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    cp_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    pm_name: Mapped[str | None] = mapped_column(String(255))
    cp_name: Mapped[str | None] = mapped_column(String(255))
    project_code: Mapped[str | None] = mapped_column(String(64))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
