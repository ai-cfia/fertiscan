from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from pydantic import EmailStr
from sqlmodel import Field, Relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.label import Label
    from app.db.models.product import Product


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
    products: list["Product"] = Relationship(back_populates="created_by")
    labels: list["Label"] = Relationship(back_populates="created_by")
