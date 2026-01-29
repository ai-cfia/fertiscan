"""Product API schemas."""

from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, StringConstraints


class ProductCreate(BaseModel):
    registration_number: Annotated[str, StringConstraints(strip_whitespace=True)]
    product_type: str
    brand_name_en: str | None = None
    brand_name_fr: str | None = None
    name_en: str | None = None
    name_fr: str | None = None


class ProductPublic(BaseModel):
    id: UUID
    brand_name_en: str | None = None
    brand_name_fr: str | None = None
    name_en: str | None = None
    name_fr: str | None = None
    registration_number: str


class ProductsPublic(BaseModel):
    data: list[ProductPublic]
    count: int
