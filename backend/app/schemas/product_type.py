"""ProductType API schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProductTypeBase(BaseModel):
    code: str = Field(max_length=255)
    name_en: str | None = Field(default=None, max_length=255)
    name_fr: str | None = Field(default=None, max_length=255)
    is_active: bool = True


class ProductTypeCreate(ProductTypeBase):
    pass


class ProductTypeUpdate(BaseModel):
    code: str | None = Field(default=None, max_length=255)
    name_en: str | None = Field(default=None, max_length=255)
    name_fr: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None


class ProductTypePublic(ProductTypeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
