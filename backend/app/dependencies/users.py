"""Users dependencies."""

from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import SecretStr, ValidationError
from sqlmodel import select

from app.config import settings
from app.core import security
from app.core.security import verify_password
from app.db.models.user import User
from app.exceptions import (
    EmailAlreadyRegistered,
    InactiveUser,
    IncorrectEmailOrPassword,
    IncorrectPassword,
    InsufficientPrivileges,
    InvalidCredentials,
    InvalidDateRange,
    InvalidToken,
    UserHasNoPassword,
    UserNotFound,
    UserWithEmailNotFound,
)
from app.schemas.auth import NewPassword, TokenPayload
from app.schemas.user import (
    PrivateUserCreate,
    UpdatePassword,
    UserCreate,
    UserParams,
    UserUpdate,
    UserUpdateMe,
)

from .session import SessionDep

# ------------------------------ OAuth2 ------------------------------
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

TokenDep = Annotated[str, Depends(reusable_oauth2)]


# ------------------------------ Login (form-based) ------------------------------
def get_user_for_login(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> User:
    if not (
        user := session.exec(
            select(User).where(User.email == form_data.username)
        ).first()
    ):
        raise IncorrectEmailOrPassword()
    if not user.hashed_password:
        raise IncorrectEmailOrPassword()
    if not security.verify_password(
        SecretStr(form_data.password), user.hashed_password
    ):
        raise IncorrectEmailOrPassword()
    if not user.is_active:
        raise InactiveUser()
    return user


LoginUserDep = Annotated[User, Depends(get_user_for_login)]


# ------------------------------ Current user ------------------------------
def get_current_user(session: SessionDep, token: TokenDep) -> User:
    """Get current authenticated user from JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY.get_secret_value(),
            algorithms=[security.ALGORITHM],
        )
        token_data = TokenPayload.model_validate(payload)
    except (jwt.InvalidTokenError, ValidationError):
        raise InvalidCredentials()
    if token_data.sub is None:
        raise InvalidCredentials()
    user = session.get(User, token_data.sub)
    if not user:
        raise UserNotFound()
    if not user.is_active:
        raise InactiveUser()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# ------------------------------ Superuser ------------------------------
def get_current_active_superuser(current_user: CurrentUser) -> User:
    """Verify current user is a superuser."""
    if not current_user.is_superuser:
        raise InsufficientPrivileges()
    return current_user


CurrentSuperuser = Annotated[User, Depends(get_current_active_superuser)]


# ------------------------------ User retrieval ------------------------------
def get_user_by_email(session: SessionDep, email: str) -> User | None:
    """Get user by email."""
    return session.exec(select(User).where(User.email == email)).first()


def get_user_by_id(session: SessionDep, user_id: UUID) -> User:
    """Get user by ID or raise 404."""
    if not (user := session.get(User, user_id)):
        raise UserNotFound()
    return user


def resolve_user_by_email(session: SessionDep, email: str) -> User:
    """Get user by email or raise 404."""
    if not (user := get_user_by_email(session, email)):
        raise UserWithEmailNotFound()
    return user


UserDep = Annotated[User, Depends(get_user_by_id)]
UserByEmailDep = Annotated[User, Depends(resolve_user_by_email)]


# ------------------------------ Params validation ------------------------------
def validate_user_params_date_range(filters: UserParams = Depends()) -> UserParams:
    if filters.start_created_at and filters.end_created_at:
        if filters.start_created_at > filters.end_created_at:
            raise InvalidDateRange()
    return filters


ValidatedUserParamsDep = Annotated[UserParams, Depends(validate_user_params_date_range)]


# ------------------------------ Email uniqueness ------------------------------
def user_create_validated(session: SessionDep, user_in: UserCreate) -> UserCreate:
    if get_user_by_email(session, user_in.email):
        raise EmailAlreadyRegistered()
    return user_in


UserCreateDep = Annotated[UserCreate, Depends(user_create_validated)]


def private_user_create_validated(
    session: SessionDep, private_user_create: PrivateUserCreate
) -> UserCreate:
    if get_user_by_email(session, private_user_create.email):
        raise EmailAlreadyRegistered()
    return UserCreate.model_validate(private_user_create.model_dump())


PrivateUserCreateDep = Annotated[UserCreate, Depends(private_user_create_validated)]


def _ensure_email_unique_for_update(
    session: SessionDep, current_user_id: UUID, new_email: str | None
) -> None:
    if (
        new_email
        and (existing := get_user_by_email(session, new_email))
        and existing.id != current_user_id
    ):
        raise EmailAlreadyRegistered()


def user_for_update_by_id(
    session: SessionDep,
    user: UserDep,
    user_update: UserUpdate,
) -> User:
    _ensure_email_unique_for_update(session, user.id, user_update.email)
    return user


UserForUpdateByIdDep = Annotated[User, Depends(user_for_update_by_id)]


def user_for_update_me(
    session: SessionDep,
    me: CurrentUser,
    me_update: UserUpdateMe,
) -> User:
    _ensure_email_unique_for_update(session, me.id, me_update.email)
    return me


UserForUpdateMeDep = Annotated[User, Depends(user_for_update_me)]


def user_for_update_password(
    me: CurrentUser,
    update_password: UpdatePassword,
) -> User:
    if not me.hashed_password:
        raise UserHasNoPassword()
    if not verify_password(update_password.current_password, me.hashed_password):
        raise IncorrectPassword()
    return me


UserForUpdatePasswordDep = Annotated[User, Depends(user_for_update_password)]


def user_for_reset_password(session: SessionDep, new_password: NewPassword) -> User:
    if not (email := security.verify_password_reset_token(new_password.token)):
        raise InvalidToken()
    if not (user := get_user_by_email(session, email)):
        raise UserWithEmailNotFound()
    if not user.is_active:
        raise InactiveUser()
    return user


UserForResetPasswordDep = Annotated[User, Depends(user_for_reset_password)]
