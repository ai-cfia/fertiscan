"""Authentication schemas."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, SecretStr


class TokenPayload(BaseModel):
    sub: UUID | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class NewPassword(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    token: str
    new_password: SecretStr = Field(min_length=8, max_length=40)
