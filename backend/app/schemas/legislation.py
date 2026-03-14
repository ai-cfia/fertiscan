"""Legislation API schemas."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class LegislationPublic(BaseModel):
    id: UUID
    citation_reference: str
    legislation_type: str | None = None
    product_type_id: UUID
    title_en: str | None = None
    title_fr: str | None = None
    description_en: str | None = None
    description_fr: str | None = None
    guidance_en: str | None = None
    guidance_fr: str | None = None
    source_url_en: str | None = None
    source_url_fr: str | None = None
    last_amended_date: date | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
