"""Rule API schemas"""

from uuid import UUID

from pydantic import BaseModel


class RuleCreate(BaseModel):
    reference_number: str
    title_en: str
    title_fr: str
    description_en: str
    description_fr: str
    url_en: str | None = None
    url_fr: str | None = None


class RulePublic(RuleCreate):
    id: UUID


class RulesPublic(BaseModel):
    data: list[RulePublic]
    count: int
