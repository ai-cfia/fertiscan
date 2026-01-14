"""Product API schemas."""

from uuid import UUID

from sqlmodel import SQLModel


class ProductPublic(SQLModel):
    id: UUID
    name_en: str | None = None
    name_fr: str | None = None
    registration_number: str


class ProductsPublic(SQLModel):
    data: list[ProductPublic]
    count: int
