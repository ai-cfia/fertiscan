"""Security utilities for password hashing and JWT tokens.

Note: Used for local/dev authentication. Will be replaced by external auth provider.
"""

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from pydantic import EmailStr, SecretStr, validate_call

from app.config import settings

ALGORITHM = "HS256"


@validate_call
def verify_password(plain_password: SecretStr, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return bcrypt.checkpw(
        plain_password.get_secret_value().encode(),
        hashed_password.encode(),
    )


@validate_call
def get_password_hash(password: SecretStr) -> str:
    """Hash a password for storing."""
    return bcrypt.hashpw(
        password.get_secret_value().encode(),
        bcrypt.gensalt(),
    ).decode()


@validate_call
def create_access_token(subject: str, expires_delta: timedelta) -> str:
    """Create JWT access token."""
    expire = datetime.now(UTC) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY.get_secret_value(),
        algorithm=ALGORITHM,
    )
    return encoded_jwt if isinstance(encoded_jwt, str) else encoded_jwt.decode()


@validate_call
def generate_password_reset_token(
    email: EmailStr, expires_delta: timedelta | None = None
) -> str:
    """Generate password reset token (JWT with short expiry)."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.EMAIL_RESET_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(UTC) + expires_delta
    to_encode = {"exp": expire, "sub": str(email)}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY.get_secret_value(),
        algorithm=ALGORITHM,
    )
    return encoded_jwt if isinstance(encoded_jwt, str) else encoded_jwt.decode()


@validate_call
def verify_password_reset_token(token: str) -> str | None:
    """Verify password reset token and return email."""
    try:
        decoded = jwt.decode(
            token,
            settings.SECRET_KEY.get_secret_value(),
            algorithms=[ALGORITHM],
        )
        sub = decoded.get("sub")
        return str(sub) if sub is not None else None
    except jwt.InvalidTokenError:
        return None
