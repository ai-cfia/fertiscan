"""LabelData ORM model."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column, DateTime
from sqlmodel import Field, Relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.label import Label


class LabelData(Base, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label_id: UUID = Field(
        foreign_key="label.id", nullable=False, unique=True, index=True
    )
    brand_name_en_extracted: str | None = Field(default=None, max_length=255)
    brand_name_en_verified: str | None = Field(default=None, max_length=255)
    brand_name_fr_extracted: str | None = Field(default=None, max_length=255)
    brand_name_fr_verified: str | None = Field(default=None, max_length=255)
    product_name_en_extracted: str | None = Field(default=None, max_length=255)
    product_name_en_verified: str | None = Field(default=None, max_length=255)
    product_name_fr_extracted: str | None = Field(default=None, max_length=255)
    product_name_fr_verified: str | None = Field(default=None, max_length=255)
    contacts_extracted: list[dict[str, Any]] | None = Field(default=None, sa_type=JSON)
    contacts_verified: list[dict[str, Any]] | None = Field(default=None, sa_type=JSON)
    registration_number_extracted: str | None = Field(default=None, max_length=255)
    registration_number_verified: str | None = Field(default=None, max_length=255)
    lot_number_extracted: str | None = Field(default=None, max_length=255)
    lot_number_verified: str | None = Field(default=None, max_length=255)
    net_weight_extracted: str | None = Field(default=None, max_length=255)
    net_weight_verified: str | None = Field(default=None, max_length=255)
    volume_extracted: str | None = Field(default=None, max_length=255)
    volume_verified: str | None = Field(default=None, max_length=255)
    label: "Label" = Relationship(back_populates="label_data")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )
