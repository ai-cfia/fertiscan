from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Query
from pydantic import BaseModel, ConfigDict, StringConstraints

from app.schemas.type import RegistrationNumber


class ProductParams(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    registration_number: str | None = Query(
        None,
        description="Filter by registration number (exact or partial match)",
        max_length=255,
    )
    brand_name_en: str | None = Query(
        None,
        description="Brand name English",
        max_length=255,
    )
    brand_name_fr: str | None = Query(
        None,
        description="Brand name French",
        max_length=255,
    )
    name_en: str | None = Query(
        None,
        description="Product name English",
        max_length=255,
    )
    name_fr: str | None = Query(
        None,
        description="Product name French",
        max_length=255,
    )
    start_created_at: datetime | None = Query(None, description="Start created at")
    end_created_at: datetime | None = Query(None, description="End created at")
    start_updated_at: datetime | None = Query(None, description="Start updated at")
    end_updated_at: datetime | None = Query(None, description="End updated at")
    order_by: Annotated[str, StringConstraints(strip_whitespace=True)] = Query(
        default="created_at", description="Field to sort by"
    )
    order: Annotated[str, StringConstraints(strip_whitespace=True)] = Query(
        default="desc", description="Sort direction (asc or desc)"
    )


class ProductCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    registration_number: RegistrationNumber | None = None
    product_type: str
    brand_name_en: str | None = None
    brand_name_fr: str | None = None
    name_en: str | None = None
    name_fr: str | None = None


class ProductPublic(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    id: UUID
    brand_name_en: str | None = None
    brand_name_fr: str | None = None
    name_en: str | None = None
    name_fr: str | None = None
    registration_number: RegistrationNumber | None = None
    created_at: datetime


class ProductsPublic(BaseModel):
    data: list[ProductPublic]
    count: int
