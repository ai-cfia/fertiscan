"""Item ORM model."""

from uuid import UUID, uuid4

from sqlmodel import Field, Relationship

from app.db.base import Base
from app.db.models.user import User


class Item(Base, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=255)
    description: str | None = None
    owner_id: UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: User | None = Relationship(back_populates="items")
