"""Authentication dependency tests."""

from datetime import UTC, datetime, timedelta
from typing import cast
from uuid import uuid4

import jwt
import pytest
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core import security
from app.dependencies.auth import get_current_active_superuser, get_current_user
from tests.factories.user import UserFactory


class TestGetCurrentUser:
    def test_valid_token(self, db: Session) -> None:
        user = UserFactory()
        token = security.create_access_token(
            subject=str(user.id), expires_delta=timedelta(minutes=15)
        )
        result = get_current_user(session=db, token=token)
        assert result.id == user.id
        assert result.email == user.email
        assert result.is_active is True

    def test_invalid_token_format(self, db: Session) -> None:
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(session=db, token="invalid.token.here")
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Could not validate credentials" in exc_info.value.detail

    def test_expired_token(self, db: Session) -> None:
        user = UserFactory()
        token = security.create_access_token(
            subject=str(user.id), expires_delta=timedelta(minutes=-15)
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(session=db, token=token)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Could not validate credentials" in exc_info.value.detail

    def test_wrong_secret(self, db: Session) -> None:
        user = UserFactory()
        expire = datetime.now(UTC) + timedelta(minutes=15)
        to_encode = {"exp": expire, "sub": str(user.id)}
        token = cast(
            str,
            jwt.encode(to_encode, "wrong_secret_key", algorithm=security.ALGORITHM),
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(session=db, token=token)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Could not validate credentials" in exc_info.value.detail

    def test_nonexistent_user(self, db: Session) -> None:
        token = security.create_access_token(
            subject=str(uuid4()), expires_delta=timedelta(minutes=15)
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(session=db, token=token)
        assert exc_info.value.status_code == 404
        assert "User not found" in exc_info.value.detail

    def test_inactive_user(self, db: Session) -> None:
        user = UserFactory()
        user.is_active = False
        db.flush()
        token = security.create_access_token(
            subject=str(user.id), expires_delta=timedelta(minutes=15)
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(session=db, token=token)
        assert exc_info.value.status_code == 400
        assert "Inactive user" in exc_info.value.detail

    def test_invalid_payload(self, db: Session) -> None:
        expire = datetime.now(UTC) + timedelta(minutes=15)
        to_encode = {"exp": expire}
        token = cast(
            str,
            jwt.encode(
                to_encode,
                settings.SECRET_KEY.get_secret_value(),
                algorithm=security.ALGORITHM,
            ),
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(session=db, token=token)
        assert exc_info.value.status_code == 403
        assert "Could not validate credentials" in exc_info.value.detail


class TestGetCurrentActiveSuperuser:
    def test_success(self, db: Session) -> None:
        user = UserFactory()
        user.is_superuser = True
        result = get_current_active_superuser(current_user=user)
        assert result.id == user.id
        assert result.is_superuser is True

    def test_failure_non_superuser(self, db: Session) -> None:
        user = UserFactory()
        user.is_superuser = False
        with pytest.raises(HTTPException) as exc_info:
            get_current_active_superuser(current_user=user)
        assert exc_info.value.status_code == 403
        assert "Insufficient privileges" in exc_info.value.detail
