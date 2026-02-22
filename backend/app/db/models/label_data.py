from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Field, Relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.label import Label
    from app.db.models.label_data_field_meta import LabelDataFieldMeta


class LabelData(Base, TimestampMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label_id: UUID = Field(
        foreign_key="label.id", nullable=False, unique=True, index=True
    )
    brand_name_en: str | None = Field(default=None, max_length=255)
    brand_name_fr: str | None = Field(default=None, max_length=255)
    product_name_en: str | None = Field(default=None, max_length=255)
    product_name_fr: str | None = Field(default=None, max_length=255)
    contacts: list[dict[str, Any]] | None = Field(default=None, sa_type=JSON)
    registration_number: str | None = Field(default=None, max_length=255)
    lot_number: str | None = Field(default=None, max_length=255)
    net_weight: str | None = Field(default=None, max_length=255)
    volume: str | None = Field(default=None, max_length=255)
    label: "Label" = Relationship(back_populates="label_data")
    meta: list["LabelDataFieldMeta"] = Relationship(
        back_populates="label_data", cascade_delete=True
    )
