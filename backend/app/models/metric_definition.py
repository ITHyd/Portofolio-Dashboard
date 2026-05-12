from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MetricDefinition(Base):
    __tablename__ = "metric_definitions"

    id: Mapped[int] = mapped_column(primary_key=True)
    metric_number: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(64))
    sub_category: Mapped[str | None] = mapped_column(String(128))
    release: Mapped[str] = mapped_column(String(16), index=True)  # MVP | REL 1 | REL 2 | REL 3 | TBC
    description: Mapped[str | None] = mapped_column(Text)
    formula: Mapped[str | None] = mapped_column(Text)
    unit: Mapped[str | None] = mapped_column(Text)
    update_frequency: Mapped[str | None] = mapped_column(String(128))
    data_owner: Mapped[str | None] = mapped_column(String(255))
