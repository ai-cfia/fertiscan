"""User routes."""

from fastapi import APIRouter, status
from fastapi_pagination import LimitOffsetPage
from fastapi_pagination.ext.sqlmodel import paginate

from app.config import settings
from app.controllers import users
from app.core.security import generate_password_reset_token
from app.dependencies import (
    CurrentSuperuser,
    CurrentUser,
    LimitOffsetParamsDep,
    SessionDep,
    UserCreateDep,
    UserDep,
    UserForUpdateByIdDep,
    UserForUpdateMeDep,
    UserForUpdatePasswordDep,
    ValidatedUserParamsDep,
)
from app.emails import generate_new_account_email, send_email
from app.schemas.message import Message
from app.schemas.user import UpdatePassword, UserPublic, UserUpdate, UserUpdateMe

router = APIRouter(prefix="/users", tags=["users"])


# ============================== User ==============================
@router.get("", response_model=LimitOffsetPage[UserPublic])
def read_users(
    session: SessionDep,
    _: CurrentSuperuser,
    params: LimitOffsetParamsDep,
    filters: ValidatedUserParamsDep,
) -> LimitOffsetPage[UserPublic]:
    """List all users (superuser only)."""
    stmt = users.get_users_query(**filters.model_dump())
    return paginate(session, stmt, params)  # type: ignore[no-any-return, arg-type]


@router.post("", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    session: SessionDep,
    _: CurrentSuperuser,
    user_in: UserCreateDep,
) -> UserPublic:
    """Create new user (superuser only)."""
    user = users.create_user(session, user_in)
    if settings.emails_enabled:
        token = generate_password_reset_token(user_in.email)
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, token=token
        )
        await send_email(email_to=user_in.email, email_data=email_data)
    return user  # type: ignore[return-value]


@router.get("/me", response_model=UserPublic)
def read_user_me(
    current_user: CurrentUser,
) -> UserPublic:
    """Get current user."""
    return current_user  # type: ignore[return-value]


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *,
    session: SessionDep,
    me: UserForUpdateMeDep,
    me_update: UserUpdateMe,
) -> UserPublic:
    """Update current user."""
    update = UserUpdate.model_validate(me_update.model_dump(exclude_unset=True))
    return users.update_user(session, me, update)  # type: ignore[return-value]


@router.patch("/me/password", response_model=Message)
def update_password_me(
    *,
    session: SessionDep,
    me: UserForUpdatePasswordDep,
    update_password: UpdatePassword,
) -> Message:
    """Update current user password."""
    users.update_user(session, me, UserUpdate(password=update_password.new_password))
    return Message(message="Password updated successfully")


@router.delete("/me", response_model=Message)
def delete_user_me(
    session: SessionDep,
    me: CurrentUser,
) -> Message:
    """Delete current user."""
    users.delete_user(session, me)
    return Message(message="User deleted successfully")


@router.get("/{user_id}", response_model=UserPublic)
def read_user(
    _: CurrentSuperuser,
    user: UserDep,
) -> UserPublic:
    """Get user by ID (superuser only)."""
    return user  # type: ignore[return-value]


@router.patch("/{user_id}", response_model=UserPublic)
def update_user(
    *,
    session: SessionDep,
    _: CurrentSuperuser,
    user: UserForUpdateByIdDep,
    user_update: UserUpdate,
) -> UserPublic:
    """Update user (superuser only)."""
    return users.update_user(session, user, user_update)  # type: ignore[return-value]


@router.delete("/{user_id}", response_model=Message)
def delete_user(
    session: SessionDep,
    _: CurrentSuperuser,
    user: UserDep,
) -> Message:
    """Delete user (superuser only)."""
    users.delete_user(session, user)
    return Message(message="User deleted successfully")
