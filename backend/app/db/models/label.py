"""Label ORM model."""

from datetime import UTC, datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, func
from sqlalchemy import Enum as sa_Enum
from sqlmodel import Field, Relationship

from app.db.base import Base
from app.db.models.product_type import ProductType
from app.db.models.user import User

if TYPE_CHECKING:
    from app.db.models.fertilizer_label_data import FertilizerLabelData
    from app.db.models.label_data import LabelData
    from app.db.models.label_image import LabelImage
    from app.db.models.non_compliance_data_item import NonComplianceDataItem
    from app.db.models.product import Product


class ReviewStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class Label(Base, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    product_id: UUID | None = Field(
        foreign_key="product.id", default=None, nullable=True, index=True
    )
    product_type_id: UUID = Field(
        foreign_key="producttype.id", nullable=False, index=True
    )
    created_by_id: UUID = Field(foreign_key="user.id", nullable=False, index=True)
    review_status: ReviewStatus = Field(
        sa_column=Column(
            sa_Enum(ReviewStatus, native_enum=False),
            index=True,
            nullable=False,
            default=ReviewStatus.not_started,
        )
    )
    product: Optional["Product"] = Relationship(back_populates="labels")
    product_type: "ProductType" = Relationship(back_populates="labels")
    created_by: User = Relationship(back_populates="labels")
    images: list["LabelImage"] = Relationship(
        back_populates="label",
        cascade_delete=True,
        sa_relationship_kwargs={"order_by": "LabelImage.sequence_order"},
    )
    label_data: Optional["LabelData"] = Relationship(
        back_populates="label", cascade_delete=True
    )
    fertilizer_label_data: Optional["FertilizerLabelData"] = Relationship(
        back_populates="label", cascade_delete=True
    )
    non_compliance_data_items: list["NonComplianceDataItem"] = Relationship(
        back_populates="label", cascade_delete=True
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()),
    )
