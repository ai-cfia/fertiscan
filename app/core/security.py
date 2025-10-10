"""Security utilities for password hashing and JWT tokens.

Note: Used for local/dev authentication. Will be replaced by external auth provider.
"""

from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext
from pydantic import EmailStr, SecretStr, validate_call

from app.config import settings

ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@validate_call
def verify_password(plain_password: SecretStr, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password.get_secret_value(), hashed_password)


@validate_call
def get_password_hash(password: SecretStr) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password.get_secret_value())


@validate_call
def create_access_token(subject: str, expires_delta: timedelta) -> str:
    """Create JWT access token."""
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@validate_call
def generate_password_reset_token(
    email: EmailStr, expires_delta: timedelta | None = None
) -> str:
    """Generate password reset token (JWT with short expiry)."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.EMAIL_RESET_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(email)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@validate_call
def verify_password_reset_token(token: str) -> str | None:
    """Verify password reset token and return email."""
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return decoded.get("sub")
    except jwt.InvalidTokenError:
        return None
