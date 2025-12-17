"""Private development endpoints - only available in local environment."""

from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.controllers import users
from app.dependencies import SessionDep
from app.schemas.user import UserCreate, UserPublic

router = APIRouter(tags=["private"], prefix="/private")


class PrivateUserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str | None = None
    last_name: str | None = None


class UserAlreadyExists(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "User already exists")


@router.post("/users/", response_model=UserPublic)
def create_user_no_verification(
    user_in: PrivateUserCreate,
    session: SessionDep,
) -> Any:
    """Create user without email verification - for testing only."""
    if users.get_user_by_email(session=session, email=user_in.email):
        raise UserAlreadyExists()
    _user_in = UserCreate.model_validate(user_in.model_dump())
    user = users.create_user(session=session, user_in=_user_in)
    return user
