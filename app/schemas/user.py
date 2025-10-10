"""User API schemas."""

from uuid import UUID

from pydantic import EmailStr, SecretStr
from sqlmodel import Field, SQLModel


class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: SecretStr = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: SecretStr = Field(min_length=8, max_length=40)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)
    password: SecretStr | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: SecretStr = Field(min_length=8, max_length=40)
    new_password: SecretStr = Field(min_length=8, max_length=40)


class UserPublic(UserBase):
    id: UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int
