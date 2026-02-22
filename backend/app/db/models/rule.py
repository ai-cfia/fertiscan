from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.non_compliance_data_item import NonComplianceDataItem


class Rule(Base, TimestampMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    reference_number: str = Field(unique=True, index=True, max_length=255)
    title_en: str
    title_fr: str
    description_en: str
    description_fr: str
    url_en: str | None = None
    url_fr: str | None = None
    evaluator_code: str | None = Field(default=None, max_length=255)
    non_compliance_data_items: list["NonComplianceDataItem"] = Relationship(
        back_populates="rule", cascade_delete=True
    )
