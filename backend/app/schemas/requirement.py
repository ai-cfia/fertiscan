"""Requirement API schemas."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Query
from pydantic import BaseModel, ConfigDict, StringConstraints


class RequirementPublic(BaseModel):
    id: UUID
    legislation_id: UUID
    title_en: str | None = None
    title_fr: str | None = None
    description_en: str | None = None
    description_fr: str | None = None
    guidance_en: str | None = None
    guidance_fr: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class RequirementsPublic(BaseModel):
    data: list[RequirementPublic]
    count: int


class RequirementParams(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    legislation_ids: list[UUID] | None = Query(
        None, description="Filter by legislation IDs (repeated param)"
    )
    title_en: str | None = Query(None, max_length=255, description="Title (English)")
    title_fr: str | None = Query(None, max_length=255, description="Title (French)")
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
