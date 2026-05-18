from datetime import date
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Column, Computed, String
from sqlalchemy.orm import relationship
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

    # Hierarchy
    parent_id: UUID | None = Field(
        default=None,
        foreign_key="provision.id",
        nullable=True,
        index=True,
    )

    # Citation components
    section: str = Field(nullable=False, max_length=50)
    subsection: str | None = Field(default=None, nullable=True, max_length=50)
    paragraph: str | None = Field(default=None, nullable=True, max_length=10)

    # Generated display citation
    citation: str | None = Field(
        default=None,
        sa_column=Column(
            String(50),
            Computed(
                "section"
                " || CASE WHEN subsection IS NOT NULL THEN '(' || subsection || ')' ELSE '' END"
                " || CASE WHEN paragraph  IS NOT NULL THEN '(' || paragraph  || ')' ELSE '' END",
                persisted=True,
            ),
            unique=True,
            index=True,
        ),
    )

    # Stable AKN URI — set once at insert, never updated
    akn_uri: str | None = Field(default=None, nullable=True, max_length=500, unique=True, index=True)

    # Amendment tracking
    superseded_by_id: UUID | None = Field(
        default=None,
        foreign_key="provision.id",
        nullable=True,
    )
    effective_date: date | None = Field(default=None, nullable=True)
    is_current: bool = Field(default=True)

    text_en: str | None = Field(default=None, nullable=True)
    text_fr: str | None = Field(default=None, nullable=True)
    is_general_exemption: bool = Field(default=False)

    # Relationships
    legislation: "Legislation" = Relationship(back_populates="provisions")
    definitions: list["Definition"] = Relationship(
        link_model=ProvisionDefinition,
        sa_relationship_kwargs={"lazy": "selectin"},
    )


# Self-referential relationships must be defined outside the class in SQLModel
Provision.parent = relationship(
    "Provision",
    foreign_keys="[Provision.parent_id]",
    remote_side="[Provision.id]",
    back_populates="children",
)
Provision.children = relationship(
    "Provision",
    foreign_keys="[Provision.parent_id]",
    back_populates="parent",
)
Provision.superseded_by = relationship(
    "Provision",
    foreign_keys="[Provision.superseded_by_id]",
    remote_side="[Provision.id]",
)
