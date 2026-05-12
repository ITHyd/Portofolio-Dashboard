from datetime import date, datetime
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Csat(Base):
    __tablename__ = "csat"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    date_collected: Mapped[date | None] = mapped_column(Date)
    score_1_5: Mapped[int | None] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text)
    collected_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    collected_by_name: Mapped[str | None] = mapped_column(String(255))
    next_collection_due: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
