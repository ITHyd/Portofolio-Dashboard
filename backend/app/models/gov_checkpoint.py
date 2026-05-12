from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GovCheckpoint(Base):
    __tablename__ = "gov_checkpoints"
    __table_args__ = (
        UniqueConstraint("project_id", "checkpoint_code", name="uq_gov_checkpoint_project_code"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    checkpoint_code: Mapped[str] = mapped_column(String(8), nullable=False, index=True)  # B1..C4
    status: Mapped[str] = mapped_column(String(32), default="Not Started", nullable=False)
    evidence_url: Mapped[str | None] = mapped_column(String(512))
    signed_off_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    signed_off_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
