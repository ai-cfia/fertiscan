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
