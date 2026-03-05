from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship

from app.db.base import Base, DescriptiveMixin, GuidanceMixin, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.definition import Definition
    from app.db.models.legislation import Legislation


class ProvisionDefinition(Base, TimestampMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    provision_id: UUID = Field(foreign_key="provision.id", index=True)
    definition_id: UUID = Field(foreign_key="definition.id", index=True)


class Provision(Base, TimestampMixin, DescriptiveMixin, GuidanceMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    legislation_id: UUID = Field(foreign_key="legislation.id", index=True)
    citation: str = Field(max_length=255, unique=True, index=True)
    text_en: str
    text_fr: str
    is_global_rule: bool = Field(default=False)

    legislation: "Legislation" = Relationship(back_populates="provisions")
    definitions: list["Definition"] = Relationship(
        link_model=ProvisionDefinition,
        sa_relationship_kwargs={"lazy": "selectin"},
    )
