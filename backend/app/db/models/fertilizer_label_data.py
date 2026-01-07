"""FertilizerLabelData ORM model."""

from datetime import UTC, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column, DateTime, Numeric
from sqlmodel import Field, Relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.label import Label


class FertilizerLabelData(Base, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label_id: UUID = Field(
        foreign_key="label.id", nullable=False, unique=True, index=True
    )
    n_extracted: Decimal | None = Field(default=None, sa_column=Column(Numeric(10, 2)))
    n_verified: Decimal | None = Field(default=None, sa_column=Column(Numeric(10, 2)))
    p_extracted: Decimal | None = Field(default=None, sa_column=Column(Numeric(10, 2)))
    p_verified: Decimal | None = Field(default=None, sa_column=Column(Numeric(10, 2)))
    k_extracted: Decimal | None = Field(default=None, sa_column=Column(Numeric(10, 2)))
    k_verified: Decimal | None = Field(default=None, sa_column=Column(Numeric(10, 2)))
    ingredients_en_extracted: list[dict[str, Any]] | None = Field(
        default=None, sa_type=JSON
    )
    ingredients_en_verified: list[dict[str, Any]] | None = Field(
        default=None, sa_type=JSON
    )
    ingredients_fr_extracted: list[dict[str, Any]] | None = Field(
        default=None, sa_type=JSON
    )
    ingredients_fr_verified: list[dict[str, Any]] | None = Field(
        default=None, sa_type=JSON
    )
    guaranteed_analysis_en_extracted: dict[str, Any] | None = Field(
        default=None, sa_type=JSON
    )
    guaranteed_analysis_en_verified: dict[str, Any] | None = Field(
        default=None, sa_type=JSON
    )
    guaranteed_analysis_fr_extracted: dict[str, Any] | None = Field(
        default=None, sa_type=JSON
    )
    guaranteed_analysis_fr_verified: dict[str, Any] | None = Field(
        default=None, sa_type=JSON
    )
    caution_en_extracted: str | None = Field(default=None)
    caution_en_verified: str | None = Field(default=None)
    caution_fr_extracted: str | None = Field(default=None)
    caution_fr_verified: str | None = Field(default=None)
    instructions_en_extracted: str | None = Field(default=None)
    instructions_en_verified: str | None = Field(default=None)
    instructions_fr_extracted: str | None = Field(default=None)
    instructions_fr_verified: str | None = Field(default=None)
    label: "Label" = Relationship(back_populates="fertilizer_label_data")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )
