"""Authentication dependencies."""

from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlmodel import Session

from app.config import settings
from app.core import security
from app.db.models.user import User
from app.db.session import get_session
from app.exceptions import (
    InactiveUser,
    InsufficientPrivileges,
    InvalidCredentials,
    UserNotFound,
)
from app.schemas.auth import TokenPayload

# Database session dependency
SessionDep = Annotated[Session, Depends(get_session)]

# OAuth2 authentication
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

TokenDep = Annotated[str, Depends(reusable_oauth2)]


# ============================== User Authentication Dependencies ==============================
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


# ============================== Authorization Dependencies ==============================
def get_current_active_superuser(current_user: CurrentUser) -> User:
    """Verify current user is a superuser."""
    if not current_user.is_superuser:
        raise InsufficientPrivileges()
    return current_user


CurrentSuperuser = Annotated[User, Depends(get_current_active_superuser)]
