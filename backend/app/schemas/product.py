"""Product API schemas."""

from uuid import UUID

from pydantic import BaseModel


class ProductPublic(BaseModel):
    id: UUID
    name_en: str | None = None
    name_fr: str | None = None
    registration_number: str


class ProductsPublic(BaseModel):
    data: list[ProductPublic]
    count: int


class ProductCreate(BaseModel):
    product_type: str
    registration_number: str
    brand_name_en: str | None = None
    brand_name_fr: str | None = None
    name_en: str | None = None
    name_fr: str | None = None
