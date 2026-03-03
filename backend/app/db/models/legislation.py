from datetime import date
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship

from app.db.base import Base, DescriptiveMixin, GuidanceMixin, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.definition import Definition
    from app.db.models.provision import Provision
    from app.db.models.requirement import Requirement


class Legislation(Base, TimestampMixin, DescriptiveMixin, GuidanceMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    citation_reference: str = Field(unique=True, index=True, max_length=255)
    legislation_type: str | None = Field(default=None, max_length=100)
    source_url_en: str | None = Field(default=None, max_length=500)
    source_url_fr: str | None = Field(default=None, max_length=500)
    last_amended_date: date | None = Field(default=None)

    provisions: list["Provision"] = Relationship(
        back_populates="legislation", cascade_delete=True
    )
    definitions: list["Definition"] = Relationship(
        back_populates="legislation", cascade_delete=True
    )
    requirements: list["Requirement"] = Relationship(
        back_populates="legislation", cascade_delete=True
    )
    global_provisions: list["Provision"] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "and_(Legislation.id == Provision.legislation_id, Provision.is_global_rule == True)",
            "viewonly": True,
            "lazy": "selectin",
        }
    )
