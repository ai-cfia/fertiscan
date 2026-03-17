"""User API schemas."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Query
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
    StringConstraints,
)


class UserParams(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    is_active: bool | None = Query(None, description="Filter by active status")
    is_superuser: bool | None = Query(None, description="Filter by superuser role")
    search: str | None = Query(
        None,
        description="Search across email, first name, last name",
        max_length=255,
    )
    start_created_at: datetime | None = Query(None, description="Start created at")
    end_created_at: datetime | None = Query(None, description="End created at")
    order_by: Annotated[str, StringConstraints(strip_whitespace=True)] = Query(
        default="created_at",
        description="Field to sort by",
    )
    order: Annotated[str, StringConstraints(strip_whitespace=True)] = Query(
        default="desc",
        description="Sort direction (asc or desc)",
    )


class UserBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: EmailStr = Field(max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: SecretStr = Field(min_length=8, max_length=40)


class PrivateUserCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


class UserRegister(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: EmailStr = Field(max_length=255)
    password: SecretStr = Field(min_length=8, max_length=40)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


class UserUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: EmailStr | None = Field(default=None, max_length=255)
    password: SecretStr | None = Field(default=None, min_length=8, max_length=40)
    is_active: bool | None = None
    is_superuser: bool | None = None
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


class UserUpdateMe(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    current_password: SecretStr = Field(min_length=8, max_length=40)
    new_password: SecretStr = Field(min_length=8, max_length=40)


class UserPublic(UserBase):
    id: UUID


class UsersPublic(BaseModel):
    data: list[UserPublic]
    count: int
