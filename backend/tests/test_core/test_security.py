"""Security utility tests."""

from datetime import UTC, datetime, timedelta
from typing import cast
from uuid import uuid4

import jwt
from pydantic import SecretStr

from app.config import settings
from app.core.security import (
    ALGORITHM,
    create_access_token,
    generate_password_reset_token,
    get_password_hash,
    verify_password,
    verify_password_reset_token,
)


def test_get_password_hash() -> None:
    """Test password hashing."""
    password = SecretStr("testpassword123")
    hashed = get_password_hash(password)
    assert hashed != password.get_secret_value()
    assert len(hashed) > 0
    assert hashed.startswith("$2b$")


def test_verify_password_correct() -> None:
    """Test password verification with correct password."""
    password = SecretStr("testpassword123")
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True


def test_verify_password_incorrect() -> None:
    """Test password verification with incorrect password."""
    password = SecretStr("testpassword123")
    wrong_password = SecretStr("wrongpassword")
    hashed = get_password_hash(password)
    assert verify_password(wrong_password, hashed) is False


def test_verify_password_different_hashes() -> None:
    """Test that same password produces different hashes (salt)."""
    password = SecretStr("testpassword123")
    hashed1 = get_password_hash(password)
    hashed2 = get_password_hash(password)
    assert hashed1 != hashed2
    assert verify_password(password, hashed1) is True
    assert verify_password(password, hashed2) is True


def test_create_access_token() -> None:
    """Test creating access token."""
    subject = str(uuid4())
    expires_delta = timedelta(minutes=60)
    token = create_access_token(subject, expires_delta)
    assert isinstance(token, str)
    assert len(token) > 0
    decoded = jwt.decode(
        token, settings.SECRET_KEY.get_secret_value(), algorithms=[ALGORITHM]
    )
    assert decoded["sub"] == subject
    assert "exp" in decoded


def test_create_access_token_expiry() -> None:
    """Test that access token has correct expiry."""
    subject = str(uuid4())
    expires_delta = timedelta(minutes=30)
    token = create_access_token(subject, expires_delta)
    decoded = jwt.decode(
        token, settings.SECRET_KEY.get_secret_value(), algorithms=[ALGORITHM]
    )
    exp_timestamp = decoded["exp"]
    exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=UTC)
    now = datetime.now(UTC)
    expected_exp = now + expires_delta
    assert abs((exp_datetime - expected_exp).total_seconds()) < 5


def test_generate_password_reset_token() -> None:
    """Test generating password reset token."""
    email = "test@example.com"
    token = generate_password_reset_token(email)
    assert isinstance(token, str)
    assert len(token) > 0
    decoded = jwt.decode(
        token, settings.SECRET_KEY.get_secret_value(), algorithms=[ALGORITHM]
    )
    assert decoded["sub"] == email
    assert "exp" in decoded


def test_generate_password_reset_token_custom_expiry() -> None:
    """Test generating password reset token with custom expiry."""
    email = "test@example.com"
    expires_delta = timedelta(minutes=15)
    token = generate_password_reset_token(email, expires_delta=expires_delta)
    decoded = jwt.decode(
        token, settings.SECRET_KEY.get_secret_value(), algorithms=[ALGORITHM]
    )
    exp_timestamp = decoded["exp"]
    exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=UTC)
    now = datetime.now(UTC)
    expected_exp = now + expires_delta
    assert abs((exp_datetime - expected_exp).total_seconds()) < 5


def test_verify_password_reset_token_valid() -> None:
    """Test verifying valid password reset token."""
    email = "test@example.com"
    token = generate_password_reset_token(email)
    result = verify_password_reset_token(token)
    assert result == email


def test_verify_password_reset_token_invalid() -> None:
    """Test verifying invalid password reset token."""
    invalid_token = "invalid.token.here"
    result = verify_password_reset_token(invalid_token)
    assert result is None


def test_verify_password_reset_token_expired() -> None:
    """Test verifying expired password reset token."""
    email = "test@example.com"
    expires_delta = timedelta(seconds=-1)
    token = generate_password_reset_token(email, expires_delta=expires_delta)
    result = verify_password_reset_token(token)
    assert result is None


def test_verify_password_reset_token_wrong_secret() -> None:
    """Test verifying token with wrong secret key."""
    email = "test@example.com"
    wrong_secret = "wrong-secret-key"
    expire = datetime.now(UTC) + timedelta(minutes=30)
    to_encode = {"exp": expire, "sub": email}
    token = cast(str, jwt.encode(to_encode, wrong_secret, algorithm=ALGORITHM))
    result = verify_password_reset_token(token)
    assert result is None
