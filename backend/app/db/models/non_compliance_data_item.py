"""NonComplianceDataItem ORM model."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, func
from sqlmodel import Field, Relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.label import Label
    from app.db.models.rule import Rule


class NonComplianceDataItem(Base, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    rule_id: UUID = Field(foreign_key="rule.id")
    label_id: UUID = Field(foreign_key="label.id")
    note: str | None = Field(default=None)
    description_en: str | None = Field(default=None)
    description_fr: str | None = Field(default=None)
    is_good: bool = Field(default=False)
    rule: "Rule" = Relationship(back_populates="non_compliance_data_items")
    label: "Label" = Relationship(back_populates="non_compliance_data_items")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()),
    )
