from uuid import UUID

from pydantic import BaseModel


class NonComplianceDataItemCreate(BaseModel):
    label_id: UUID
    rule_id: UUID
    note: str | None = None
    description_en: str | None = None
    description_fr: str | None = None
    is_compliant: bool = False


class NonComplianceDataItemPublic(NonComplianceDataItemCreate):
    id: UUID
