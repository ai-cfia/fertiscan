from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Column
from sqlalchemy import Enum as sa_Enum
from sqlmodel import Field, Relationship

from app.db.base import Base, DescriptiveMixin, GuidanceMixin, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.legislation import Legislation
    from app.db.models.non_compliance_data_item import NonComplianceDataItem
    from app.db.models.provision import Provision


from app.db.models.enums import ModifierType


class RequirementProvision(Base, TimestampMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    requirement_id: UUID = Field(foreign_key="requirement.id", index=True)
    provision_id: UUID = Field(foreign_key="provision.id", index=True)


class RequirementModifier(Base, TimestampMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    requirement_id: UUID = Field(foreign_key="requirement.id", index=True)
    provision_id: UUID = Field(foreign_key="provision.id", index=True)
    type: ModifierType = Field(
        sa_column=Column(
            sa_Enum(ModifierType, native_enum=False),
            index=True,
            nullable=False,
        )
    )


class Requirement(Base, TimestampMixin, DescriptiveMixin, GuidanceMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    legislation_id: UUID = Field(foreign_key="legislation.id", index=True)

    legislation: "Legislation" = Relationship(back_populates="requirements")

    provisions: list["Provision"] = Relationship(
        link_model=RequirementProvision,
        sa_relationship_kwargs={"lazy": "selectin"},
    )
    modifiers: list["Provision"] = Relationship(
        link_model=RequirementModifier,
        sa_relationship_kwargs={"lazy": "selectin"},
    )
    non_compliance_data_items: list["NonComplianceDataItem"] = Relationship(
        back_populates="requirement", cascade_delete=True
    )
