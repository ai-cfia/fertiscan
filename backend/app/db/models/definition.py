from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship

from app.db.base import Base, DescriptiveMixin, GuidanceMixin, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.legislation import Legislation


class Definition(Base, TimestampMixin, DescriptiveMixin, GuidanceMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    legislation_id: UUID = Field(foreign_key="legislation.id", index=True)
    title_en: str = Field(max_length=255)
    title_fr: str = Field(max_length=255)
    text_en: str
    text_fr: str

    legislation: "Legislation" = Relationship(back_populates="definitions")
