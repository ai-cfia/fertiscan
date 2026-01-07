"""User ORM model."""

from uuid import UUID, uuid4

from pydantic import EmailStr
from sqlmodel import Field

from app.db.base import Base
from app.db.models.mixins import TimestampMixin


class User(Base, TimestampMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    hashed_password: str | None = Field(
        default=None, description="Bcrypt hashed password for local authentication"
    )
    external_id: str | None = Field(
        default=None,
        unique=True,
        index=True,
        max_length=255,
        description="External identity provider subject identifier (OIDC sub claim)",
    )
