"""Authentication dependency tests."""

from datetime import UTC, datetime, timedelta
from typing import cast
from uuid import uuid4

import jwt
import pytest
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core import security
from app.dependencies import get_current_active_superuser, get_current_user
from tests.utils.user import create_random_user


async def test_get_current_user_valid_token(db: AsyncSession) -> None:
    """Test get_current_user with valid token and active user."""
    user = await create_random_user(db)
    await db.commit()
    token = security.create_access_token(
        subject=str(user.id), expires_delta=timedelta(minutes=15)
    )
    result = await get_current_user(session=db, token=token)
    assert result.id == user.id
    assert result.email == user.email
    assert result.is_active is True


async def test_get_current_user_invalid_token_format(db: AsyncSession) -> None:
    """Test get_current_user with invalid token format."""
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(session=db, token="invalid.token.here")
    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert "Could not validate credentials" in exc_info.value.detail


async def test_get_current_user_expired_token(db: AsyncSession) -> None:
    """Test get_current_user with expired token."""
    user = await create_random_user(db)
    await db.commit()
    expired_delta = timedelta(minutes=-15)
    token = security.create_access_token(
        subject=str(user.id), expires_delta=expired_delta
    )
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(session=db, token=token)
    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert "Could not validate credentials" in exc_info.value.detail


async def test_get_current_user_wrong_secret(db: AsyncSession) -> None:
    """Test get_current_user with token signed with wrong secret."""
    user = await create_random_user(db)
    await db.commit()
    expire = datetime.now(UTC) + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": str(user.id)}
    token = cast(
        str, jwt.encode(to_encode, "wrong_secret_key", algorithm=security.ALGORITHM)
    )
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(session=db, token=token)
    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert "Could not validate credentials" in exc_info.value.detail


async def test_get_current_user_nonexistent_user(db: AsyncSession) -> None:
    """Test get_current_user with token for non-existent user."""
    nonexistent_id = uuid4()
    token = security.create_access_token(
        subject=str(nonexistent_id), expires_delta=timedelta(minutes=15)
    )
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(session=db, token=token)
    assert exc_info.value.status_code == 404
    assert "User not found" in exc_info.value.detail


async def test_get_current_user_inactive_user(db: AsyncSession) -> None:
    """Test get_current_user with inactive user."""
    user = await create_random_user(db)
    user.is_active = False
    await db.commit()
    token = security.create_access_token(
        subject=str(user.id), expires_delta=timedelta(minutes=15)
    )
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(session=db, token=token)
    assert exc_info.value.status_code == 400
    assert "Inactive user" in exc_info.value.detail


async def test_get_current_user_invalid_payload(db: AsyncSession) -> None:
    """Test get_current_user with token missing required payload fields."""
    expire = datetime.now(UTC) + timedelta(minutes=15)
    to_encode = {"exp": expire}
    token = cast(
        str, jwt.encode(to_encode, settings.SECRET_KEY, algorithm=security.ALGORITHM)
    )
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(session=db, token=token)
    assert exc_info.value.status_code == 404
    assert "User not found" in exc_info.value.detail


async def test_get_current_active_superuser_success(db: AsyncSession) -> None:
    """Test get_current_active_superuser with superuser."""
    user = await create_random_user(db)
    user.is_superuser = True
    await db.commit()
    result = get_current_active_superuser(current_user=user)
    assert result.id == user.id
    assert result.is_superuser is True


async def test_get_current_active_superuser_failure(db: AsyncSession) -> None:
    """Test get_current_active_superuser with non-superuser."""
    user = await create_random_user(db)
    user.is_superuser = False
    await db.commit()
    with pytest.raises(HTTPException) as exc_info:
        get_current_active_superuser(current_user=user)
    assert exc_info.value.status_code == 403
    assert "doesn't have enough privileges" in exc_info.value.detail
