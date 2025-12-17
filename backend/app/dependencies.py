"""FastAPI dependency injection."""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.config import settings
from app.core import security
from app.db.models.user import User
from app.db.session import get_session
from app.schemas.auth import TokenPayload

# Database session dependency
SessionDep = Annotated[Session, Depends(get_session)]

# OAuth2 authentication
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

TokenDep = Annotated[str, Depends(reusable_oauth2)]


# User authentication dependencies
def get_current_user(
    session: SessionDep,
    token: TokenDep,
) -> User:
    """Get current authenticated user from JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[security.ALGORITHM],
        )
        token_data = TokenPayload.model_validate(payload)
    except (jwt.InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# Authorization dependencies
def get_current_active_superuser(
    current_user: CurrentUser,
) -> User:
    """Verify current user is a superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


CurrentSuperuser = Annotated[User, Depends(get_current_active_superuser)]
