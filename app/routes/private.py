"""Private development endpoints - only available in local environment."""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.controllers import users as users_controller
from app.dependencies import AsyncSessionDep
from app.schemas.user import UserCreate, UserPublic

router = APIRouter(tags=["private"], prefix="/private")


class PrivateUserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str | None = None
    last_name: str | None = None


@router.post("/users/", response_model=UserPublic)
async def create_user_no_verification(
    user_in: PrivateUserCreate,
    session: AsyncSessionDep,
) -> Any:
    """Create user without email verification - for testing only."""
    if await users_controller.get_user_by_email(session=session, email=user_in.email):
        raise HTTPException(status_code=400, detail="User already exists")
    _user_in = UserCreate.model_validate(user_in.model_dump())
    user = await users_controller.create_user(session=session, user_in=_user_in)
    return user
