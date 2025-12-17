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


class TestGetCurrentUser:
    async def test_valid_token(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        token = security.create_access_token(
            subject=str(user.id), expires_delta=timedelta(minutes=15)
        )
        result = await get_current_user(session=db, token=token)
        assert result.id == user.id
        assert result.email == user.email
        assert result.is_active is True

    async def test_invalid_token_format(self, db: AsyncSession) -> None:
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(session=db, token="invalid.token.here")
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Could not validate credentials" in exc_info.value.detail

    async def test_expired_token(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        token = security.create_access_token(
            subject=str(user.id), expires_delta=timedelta(minutes=-15)
        )
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(session=db, token=token)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Could not validate credentials" in exc_info.value.detail

    async def test_wrong_secret(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        expire = datetime.now(UTC) + timedelta(minutes=15)
        to_encode = {"exp": expire, "sub": str(user.id)}
        token = cast(
            str,
            jwt.encode(to_encode, "wrong_secret_key", algorithm=security.ALGORITHM),
        )
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(session=db, token=token)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Could not validate credentials" in exc_info.value.detail

    async def test_nonexistent_user(self, db: AsyncSession) -> None:
        token = security.create_access_token(
            subject=str(uuid4()), expires_delta=timedelta(minutes=15)
        )
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(session=db, token=token)
        assert exc_info.value.status_code == 404
        assert "User not found" in exc_info.value.detail

    async def test_inactive_user(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        user.is_active = False
        await db.flush()
        token = security.create_access_token(
            subject=str(user.id), expires_delta=timedelta(minutes=15)
        )
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(session=db, token=token)
        assert exc_info.value.status_code == 400
        assert "Inactive user" in exc_info.value.detail

    async def test_invalid_payload(self, db: AsyncSession) -> None:
        expire = datetime.now(UTC) + timedelta(minutes=15)
        to_encode = {"exp": expire}
        token = cast(
            str,
            jwt.encode(to_encode, settings.SECRET_KEY, algorithm=security.ALGORITHM),
        )
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(session=db, token=token)
        assert exc_info.value.status_code == 404
        assert "User not found" in exc_info.value.detail


class TestGetCurrentActiveSuperuser:
    async def test_success(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        user.is_superuser = True
        await db.flush()
        result = get_current_active_superuser(current_user=user)
        assert result.id == user.id
        assert result.is_superuser is True

    async def test_failure_non_superuser(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        user.is_superuser = False
        await db.flush()
        with pytest.raises(HTTPException) as exc_info:
            get_current_active_superuser(current_user=user)
        assert exc_info.value.status_code == 403
        assert "doesn't have enough privileges" in exc_info.value.detail
