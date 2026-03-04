from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from pydantic import field_validator
from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.fertilizer_label_data import FertilizerLabelData


class FertilizerLabelDataFieldName(str, Enum):
    """Valid field names for FertilizerLabelDataMeta."""

    n = "n"
    p = "p"
    k = "k"
    ingredients = "ingredients"
    guaranteed_analysis = "guaranteed_analysis"
    caution_en = "caution_en"
    caution_fr = "caution_fr"
    instructions_en = "instructions_en"
    instructions_fr = "instructions_fr"
    is_customer_formula = "is_customer_formula"
    intended_use_statements = "intended_use_statements"
    processing_instruction_statements = "processing_instruction_statements"


class FertilizerLabelDataMeta(Base, TimestampMixin, table=True):
    """Metadata for FertilizerLabelData fields (review flags, notes, AI generation tracking)."""

    __table_args__ = (
        UniqueConstraint(
            "label_id",
            "field_name",
            name="uq_fertilizerlabeldatameta_label_id_field_name",
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label_id: UUID = Field(
        foreign_key="fertilizerlabeldata.id",
        nullable=False,
        index=True,
    )
    field_name: str = Field(max_length=255, index=True)
    needs_review: bool = Field(default=False)
    note: str | None = Field(default=None)
    ai_generated: bool = Field(default=False)
    fertilizer_label_data: "FertilizerLabelData" = Relationship(back_populates="meta")

    @field_validator("field_name")
    @classmethod
    def validate_field_name(cls, v: str) -> str:
        """Validate that field_name is a valid FertilizerLabelDataFieldName."""
        try:
            FertilizerLabelDataFieldName(v)
        except ValueError:
            raise ValueError(
                f"Invalid field_name: {v}. Must be one of {[e.value for e in FertilizerLabelDataFieldName]}"
            )
        return v
