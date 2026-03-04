from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column, Numeric
from sqlalchemy import Enum as sa_Enum
from sqlmodel import Field, Relationship

from app.db.base import Base, TimestampMixin
from app.db.models.enums import ProductClassification

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
    precaution_statements: list[dict[str, str]] | None = Field(
        default=None, sa_type=JSON
    )
    directions_for_use_statements: list[dict[str, str]] | None = Field(
        default=None, sa_type=JSON
    )
    customer_formula_statements: list[dict[str, str]] | None = Field(
        default=None, sa_type=JSON
    )
    intended_use_statements: list[dict[str, str]] | None = Field(
        default=None, sa_type=JSON
    )
    processing_instruction_statements: list[dict[str, str]] | None = Field(
        default=None, sa_type=JSON
    )
    experimental_statements: list[dict[str, str]] | None = Field(
        default=None, sa_type=JSON
    )
    export_statements: list[dict[str, str]] | None = Field(default=None, sa_type=JSON)
    product_classification: ProductClassification | None = Field(
        default=None,
        sa_column=Column(
            sa_Enum(ProductClassification, native_enum=False), nullable=True
        ),
    )
    label: "Label" = Relationship(back_populates="fertilizer_label_data")
    meta: list["FertilizerLabelDataMeta"] = Relationship(
        back_populates="fertilizer_label_data", cascade_delete=True
    )
