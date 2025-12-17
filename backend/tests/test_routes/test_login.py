"""Login and authentication route tests."""

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.controllers.users import create_user
from app.core.security import generate_password_reset_token, verify_password
from app.schemas.user import UserCreate
from tests.utils.utils import random_email, random_lower_string


@pytest.mark.usefixtures("override_dependencies")
class TestAccessToken:
    """Tests for access token login flow."""

    def test_get_access_token(self, client: TestClient) -> None:
        """Test successful login with access token."""
        login_data = {
            "username": settings.FIRST_SUPERUSER,
            "password": settings.FIRST_SUPERUSER_PASSWORD,
        }
        response = client.post(
            f"{settings.API_V1_STR}/login/access-token", data=login_data
        )
        assert response.status_code == 200
        tokens = response.json()
        assert "access_token" in tokens
        assert tokens["access_token"]

    def test_get_access_token_incorrect_password(self, client: TestClient) -> None:
        """Test login with incorrect password."""
        login_data = {
            "username": settings.FIRST_SUPERUSER,
            "password": "incorrect",
        }
        response = client.post(
            f"{settings.API_V1_STR}/login/access-token", data=login_data
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Incorrect email or password"

    def test_get_access_token_user_not_found(self, client: TestClient) -> None:
        """Test login with non-existent user."""
        login_data = {
            "username": "nonexistent@example.com",
            "password": "password",
        }
        response = client.post(
            f"{settings.API_V1_STR}/login/access-token", data=login_data
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Incorrect email or password"

    def test_use_access_token(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        """Test using access token to get current user."""
        response = client.post(
            f"{settings.API_V1_STR}/login/test-token",
            headers=superuser_token_headers,
        )
        assert response.status_code == 200
        result = response.json()
        assert "email" in result
        assert result["email"] == settings.FIRST_SUPERUSER

    async def test_login_inactive_user(
        self, client: TestClient, db: AsyncSession
    ) -> None:
        """Test login with inactive user."""
        email = random_email()
        password = random_lower_string()
        await create_user(
            db, UserCreate(email=email, password=password, is_active=False)
        )
        login_data = {"username": email, "password": password}
        response = client.post(
            f"{settings.API_V1_STR}/login/access-token", data=login_data
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Inactive user"


@pytest.mark.usefixtures("override_dependencies")
class TestPasswordRecovery:
    """Tests for password recovery flow."""

    async def test_recovery_password(
        self, client: TestClient, db: AsyncSession
    ) -> None:
        """Test password recovery for existing user."""
        email = random_email()
        password = random_lower_string()
        await create_user(db, UserCreate(email=email, password=password))
        response = client.post(f"{settings.API_V1_STR}/password-recovery/{email}")
        assert response.status_code == 200
        assert response.json() == {"message": "Password recovery email sent"}

    def test_recovery_password_user_not_exists(self, client: TestClient) -> None:
        """Test password recovery for non-existent user."""
        email = random_email()
        response = client.post(f"{settings.API_V1_STR}/password-recovery/{email}")
        assert response.status_code == 404
        assert (
            response.json()["detail"]
            == "The user with this email does not exist in the system."
        )

    async def test_recovery_password_html_content(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: AsyncSession,
    ) -> None:
        """Test password recovery HTML content endpoint (superuser only)."""
        email = random_email()
        password = random_lower_string()
        await create_user(db, UserCreate(email=email, password=password))
        response = client.post(
            f"{settings.API_V1_STR}/password-recovery-html-content/{email}",
            headers=superuser_token_headers,
        )
        assert response.status_code == 200
        assert "subject" in response.headers
        assert response.headers["content-type"] == "text/html; charset=utf-8"

    def test_recovery_password_html_content_user_not_exists(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        """Test password recovery HTML content for non-existent user."""
        email = random_email()
        response = client.post(
            f"{settings.API_V1_STR}/password-recovery-html-content/{email}",
            headers=superuser_token_headers,
        )
        assert response.status_code == 404
        assert (
            response.json()["detail"]
            == "The user with this username does not exist in the system."
        )


@pytest.mark.usefixtures("override_dependencies")
class TestPasswordReset:
    """Tests for password reset flow."""

    async def test_reset_password(self, client: TestClient, db: AsyncSession) -> None:
        """Test password reset with valid token."""
        email = random_email()
        password = random_lower_string()
        new_password = random_lower_string()
        user = await create_user(db, UserCreate(email=email, password=password))
        token = generate_password_reset_token(email)
        data = {"new_password": new_password, "token": token}
        response = client.post(
            f"{settings.API_V1_STR}/reset-password/",
            json=data,
        )
        assert response.status_code == 200
        assert response.json() == {"message": "Password updated successfully"}
        await db.refresh(user)
        assert user.hashed_password
        assert verify_password(SecretStr(new_password), user.hashed_password)

    def test_reset_password_invalid_token(self, client: TestClient) -> None:
        """Test password reset with invalid token."""
        data = {"new_password": "changethis", "token": "invalid"}
        response = client.post(
            f"{settings.API_V1_STR}/reset-password/",
            json=data,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid token"

    def test_reset_password_user_not_found(self, client: TestClient) -> None:
        """Test password reset with valid token but user doesn't exist."""
        email = random_email()
        token = generate_password_reset_token(email)
        data = {"new_password": "changethis", "token": token}
        response = client.post(
            f"{settings.API_V1_STR}/reset-password/",
            json=data,
        )
        assert response.status_code == 404
        assert (
            response.json()["detail"]
            == "The user with this email does not exist in the system."
        )

    async def test_reset_password_inactive_user(
        self, client: TestClient, db: AsyncSession
    ) -> None:
        """Test password reset for inactive user."""
        email = random_email()
        password = random_lower_string()
        new_password = random_lower_string()
        await create_user(
            db, UserCreate(email=email, password=password, is_active=False)
        )
        token = generate_password_reset_token(email)
        data = {"new_password": new_password, "token": token}
        response = client.post(
            f"{settings.API_V1_STR}/reset-password/",
            json=data,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Inactive user"
