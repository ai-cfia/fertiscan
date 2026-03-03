from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Query
from pydantic import BaseModel, ConfigDict, StringConstraints


class NonComplianceDataItemCreate(BaseModel):
    label_id: UUID
    requirement_id: UUID
    note: str | None = None
    description_en: str | None = None
    description_fr: str | None = None
    is_compliant: bool = False


class NonComplianceDataItemPublic(NonComplianceDataItemCreate):
    id: UUID


class NonComplianceDataItemPayload(BaseModel):
    requirement_id: UUID
    note: str | None = None
    description_en: str | None = None
    description_fr: str | None = None
    is_compliant: bool = False


class NonComplianceDataItemParams(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    note: str | None = Query(None, description="Note to filter by")
    description_en: str | None = Query(None, description="description_en to filter by")
    description_fr: str | None = Query(None, description="description_fr to filter by")
    is_compliant: bool | None = Query(
        None, description="Compliance status to filter by"
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


class UpdateNonComplianceDataItemPayload(BaseModel):
    note: str | None = None
    description_en: str | None = None
    description_fr: str | None = None
    is_compliant: bool | None = None
