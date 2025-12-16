"""Authentication schemas."""

from uuid import UUID

from sqlmodel import SQLModel


class TokenPayload(SQLModel):
    sub: UUID | None = None


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class NewPassword(SQLModel):
    token: str
    new_password: str
