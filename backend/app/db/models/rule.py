"""Rule ORM model."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, func
from sqlmodel import Field, Relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.non_compliance_data_item import NonComplianceDataItem


class Rule(Base, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    reference_number: str = Field(unique=True, index=True, max_length=255)
    title_en: str
    title_fr: str
    description_en: str
    description_fr: str
    url_en: str | None = None
    url_fr: str | None = None
    ai_verify: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()),
    )
    non_compliance_data_items: list["NonComplianceDataItem"] = Relationship(
        back_populates="rule", cascade_delete=True
    )
