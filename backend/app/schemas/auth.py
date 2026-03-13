"""Authentication schemas."""

from uuid import UUID

from pydantic import BaseModel


class TokenPayload(BaseModel):
    sub: UUID | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class NewPassword(BaseModel):
    token: str
    new_password: str
