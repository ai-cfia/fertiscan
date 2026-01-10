"""Product API schemas."""

from uuid import UUID

from sqlmodel import SQLModel


class ProductPublic(SQLModel):
    id: UUID


class ProductsPublic(SQLModel):
    data: list[ProductPublic]
    count: int
