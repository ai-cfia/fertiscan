"""User routes."""

from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.controllers import users as u
from app.core.security import generate_password_reset_token, verify_password
from app.dependencies import CurrentSuperuser, CurrentUser, SessionDep
from app.emails import generate_new_account_email, send_email
from app.schemas.message import Message
from app.schemas.user import (
    UpdatePassword,
    UserCreate,
    UserPublic,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=UsersPublic)
async def read_users(
    session: SessionDep, _: CurrentSuperuser, skip: int = 0, limit: int = 100
) -> UsersPublic:
    """List all users (superuser only)."""
    users, count = await u.get_users(session, skip=skip, limit=limit)
    return UsersPublic(data=users, count=count)


@router.post("", response_model=UserPublic, status_code=201)
async def create_user(
    *, session: SessionDep, _: CurrentSuperuser, user_in: UserCreate
) -> UserPublic:
    """Create new user (superuser only)."""
    if await u.get_user_by_email(session, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await u.create_user(session, user_in)
    if settings.emails_enabled:
        token = generate_password_reset_token(user_in.email)
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, token=token
        )
        await send_email(email_to=user_in.email, email_data=email_data)
    return user


@router.get("/me", response_model=UserPublic)
async def read_user_me(current_user: CurrentUser) -> UserPublic:
    """Get current user."""
    return current_user


@router.patch("/me", response_model=UserPublic)
async def update_user_me(
    *, session: SessionDep, current_user: CurrentUser, user_in: UserUpdateMe
) -> UserPublic:
    """Update current user."""
    if user_in.email:
        if existing := await u.get_user_by_email(session, user_in.email):
            if existing.id != current_user.id:
                raise HTTPException(status_code=400, detail="Email already registered")
    if not (user := await u.update_user(session, current_user.id, user_in)):
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me/password", response_model=Message)
async def update_password_me(
    *, session: SessionDep, current_user: CurrentUser, body: UpdatePassword
) -> Message:
    """Update current user password."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if not await u.update_user(
        session, current_user.id, UserUpdate(password=body.new_password)
    ):
        raise HTTPException(status_code=404, detail="User not found")
    return Message(message="Password updated successfully")


@router.delete("/me", response_model=Message)
async def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Message:
    """Delete current user."""
    if not await u.delete_user(session, current_user.id):
        raise HTTPException(status_code=404, detail="User not found")
    return Message(message="User deleted successfully")


@router.get("/{user_id}", response_model=UserPublic)
async def read_user_by_id(
    session: SessionDep, current_user: CurrentSuperuser, user_id: UUID
) -> UserPublic:
    """Get user by ID (superuser only)."""
    if not (user := await u.get_user_by_id(session, user_id)):
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserPublic)
async def update_user(
    *,
    session: SessionDep,
    current_user: CurrentSuperuser,
    user_id: UUID,
    user_in: UserUpdate,
) -> UserPublic:
    """Update user (superuser only)."""
    if user_in.email:
        if existing := await u.get_user_by_email(session, user_in.email):
            if existing.id != user_id:
                raise HTTPException(status_code=400, detail="Email already registered")
    if not (user := await u.update_user(session, user_id, user_in)):
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", response_model=Message)
async def delete_user(
    session: SessionDep, current_user: CurrentSuperuser, user_id: UUID
) -> Message:
    """Delete user (superuser only)."""
    if not await u.delete_user(session, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return Message(message="User deleted successfully")
