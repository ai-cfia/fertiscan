from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship

from app.db.base import Base, TimestampMixin
from app.db.models.product_type import ProductType
from app.db.models.user import User

if TYPE_CHECKING:
    from app.db.models.label import Label


class Product(Base, TimestampMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_by_id: UUID = Field(foreign_key="user.id", nullable=False, index=True)
    product_type_id: UUID = Field(
        foreign_key="producttype.id", nullable=False, index=True
    )
    brand_name_en: str | None = Field(default=None, max_length=255)
    brand_name_fr: str | None = Field(default=None, max_length=255)
    registration_number: str | None = Field(
        default=None, unique=True, index=True, max_length=255, nullable=True
    )
    name_en: str | None = Field(default=None, max_length=255)
    name_fr: str | None = Field(default=None, max_length=255)
    created_by: User = Relationship(back_populates="products")
    product_type: "ProductType" = Relationship(back_populates="products")
    labels: list["Label"] = Relationship(back_populates="product", cascade_delete=True)
