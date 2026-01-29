"""LabelDataFieldMeta ORM model."""

from datetime import UTC, datetime
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from pydantic import field_validator
from sqlalchemy import Column, DateTime, UniqueConstraint, func
from sqlmodel import Field, Relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.label_data import LabelData


class LabelDataFieldName(str, Enum):
    """Valid field names for LabelDataFieldMeta."""

    brand_name_en = "brand_name_en"
    brand_name_fr = "brand_name_fr"
    product_name_en = "product_name_en"
    product_name_fr = "product_name_fr"
    contacts = "contacts"
    registration_number = "registration_number"
    lot_number = "lot_number"
    net_weight = "net_weight"
    volume = "volume"


class LabelDataFieldMeta(Base, table=True):
    """Metadata for LabelData fields (review flags, notes, AI generation tracking)."""

    __table_args__ = (
        UniqueConstraint(
            "label_id", "field_name", name="uq_labeldatafieldmeta_label_id_field_name"
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label_id: UUID = Field(
        foreign_key="labeldata.id",
        nullable=False,
        index=True,
    )
    field_name: str = Field(max_length=255, index=True)
    needs_review: bool = Field(default=False)
    note: str | None = Field(default=None)
    ai_generated: bool = Field(default=False)
    label_data: "LabelData" = Relationship(back_populates="meta")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()),
    )

    @field_validator("field_name")
    @classmethod
    def validate_field_name(cls, v: str) -> str:
        """Validate that field_name is a valid LabelDataFieldName."""
        try:
            LabelDataFieldName(v)
        except ValueError:
            raise ValueError(
                f"Invalid field_name: {v}. Must be one of {[e.value for e in LabelDataFieldName]}"
            )
        return v
