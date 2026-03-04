from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column, Numeric
from sqlmodel import Field, Relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.fertilizer_label_data_meta import FertilizerLabelDataMeta
    from app.db.models.label import Label


class FertilizerLabelData(Base, TimestampMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label_id: UUID = Field(
        foreign_key="label.id", nullable=False, unique=True, index=True
    )
    n: Decimal | None = Field(default=None, sa_column=Column(Numeric(10, 2)))
    p: Decimal | None = Field(default=None, sa_column=Column(Numeric(10, 2)))
    k: Decimal | None = Field(default=None, sa_column=Column(Numeric(10, 2)))
    ingredients: list[dict[str, Any]] | None = Field(default=None, sa_type=JSON)
    guaranteed_analysis: dict[str, Any] | None = Field(default=None, sa_type=JSON)
    caution_en: str | None = Field(default=None)
    caution_fr: str | None = Field(default=None)
    instructions_en: str | None = Field(default=None)
    instructions_fr: str | None = Field(default=None)
    is_customer_formula: bool | None = Field(default=None)
    intended_use_statements: list[str] | None = Field(default=None, sa_type=JSON)
    processing_instruction_statements: list[str] | None = Field(
        default=None, sa_type=JSON
    )
    label: "Label" = Relationship(back_populates="fertilizer_label_data")
    meta: list["FertilizerLabelDataMeta"] = Relationship(
        back_populates="fertilizer_label_data", cascade_delete=True
    )
