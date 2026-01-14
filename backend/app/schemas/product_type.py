"""ProductType API schemas."""

from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel


class ProductTypeBase(SQLModel):
    code: str = Field(unique=True, index=True, max_length=255)
    name_en: str | None = Field(default=None, max_length=255)
    name_fr: str | None = Field(default=None, max_length=255)
    is_active: bool = True


class ProductTypeCreate(ProductTypeBase):
    pass


class ProductTypeUpdate(SQLModel):
    code: str | None = Field(default=None, max_length=255)
    name_en: str | None = Field(default=None, max_length=255)
    name_fr: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None


class ProductTypePublic(ProductTypeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
