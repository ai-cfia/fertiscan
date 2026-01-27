"""Product API schemas."""

from uuid import UUID

from pydantic import BaseModel


class ProductCreate(BaseModel):
    registration_number: str
    product_type: str
    brand_name_en: str | None = None
    brand_name_fr: str | None = None
    name_en: str | None = None
    name_fr: str | None = None


class ProductPublic(BaseModel):
    id: UUID
    name_en: str | None = None
    name_fr: str | None = None
    registration_number: str


class ProductsPublic(BaseModel):
    data: list[ProductPublic]
    count: int
