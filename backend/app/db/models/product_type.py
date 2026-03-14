from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.label import Label
    from app.db.models.legislation import Legislation
    from app.db.models.product import Product


class ProductType(Base, TimestampMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    code: str = Field(unique=True, index=True, max_length=255)
    name_en: str | None = Field(default=None, max_length=255)
    name_fr: str | None = Field(default=None, max_length=255)
    is_active: bool = Field(default=True, index=True)
    products: list["Product"] = Relationship(back_populates="product_type")
    labels: list["Label"] = Relationship(back_populates="product_type")
    legislations: list["Legislation"] = Relationship(back_populates="product_type")
