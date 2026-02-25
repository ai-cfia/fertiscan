from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.label import Label
    from app.db.models.rule import Rule


class NonComplianceDataItem(Base, TimestampMixin, table=True):
    __table_args__ = (
        UniqueConstraint(
            "label_id",
            "rule_id",
            name="uq_noncompliancedataitem_label_id_rule_id",
        ),
    )
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    rule_id: UUID = Field(foreign_key="rule.id")
    label_id: UUID = Field(foreign_key="label.id")
    note: str | None = None
    description_en: str | None = None
    description_fr: str | None = None
    is_compliant: bool = False
    rule: "Rule" = Relationship(back_populates="non_compliance_data_items")
    label: "Label" = Relationship(back_populates="non_compliance_data_items")
