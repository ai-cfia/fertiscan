"""Provision API schemas."""

from pydantic import BaseModel, ConfigDict


class ProvisionSnippet(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    citation: str
    text_en: str | None = None
    text_fr: str | None = None
