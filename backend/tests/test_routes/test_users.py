"""User route tests."""

from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.controllers.users import create_user, update_user
from app.schemas.user import UserCreate, UserUpdate
from tests.utils.user import (
    authentication_token_from_email,
    create_random_user,
    user_authentication_headers,
)
from tests.utils.utils import random_email, random_lower_string


@pytest.mark.usefixtures("override_dependencies")
class TestUserMe:
    """Tests for current user endpoints (/users/me)."""

    async def test_read_user_me(
        self, client: TestClient, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting current user."""
        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers=normal_user_token_headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert "id" in content
        assert "email" in content

    async def test_update_user_me(self, client: TestClient, db: AsyncSession) -> None:
        """Test updating current user."""
        user = await create_random_user(db)
        headers = await authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {"first_name": "Updated", "last_name": "Name"}
        response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["first_name"] == "Updated"
        assert content["last_name"] == "Name"

    async def test_update_user_me_email_conflict(
        self, client: TestClient, db: AsyncSession
    ) -> None:
        """Test updating current user email to existing email."""
        user1 = await create_random_user(db)
        user2 = await create_random_user(db)
        headers = await authentication_token_from_email(
            client=client, email=user1.email, db=db
        )
        data = {"email": user2.email}
        response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
            json=data,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Email already registered"

    async def test_update_user_me_email_same(
        self, client: TestClient, db: AsyncSession
    ) -> None:
        """Test updating current user email to same email (should succeed)."""
        user = await create_random_user(db)
        headers = await authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {"email": user.email, "first_name": "Updated"}
        response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["email"] == user.email
        assert content["first_name"] == "Updated"

    async def test_delete_user_me(self, client: TestClient, db: AsyncSession) -> None:
        """Test deleting current user."""
        user = await create_random_user(db)
        headers = await authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.delete(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "User deleted successfully"


@pytest.mark.usefixtures("override_dependencies")
class TestUserPassword:
    """Tests for password update endpoints."""

    async def test_update_password_me(
        self, client: TestClient, db: AsyncSession
    ) -> None:
        """Test updating current user password."""
        user = await create_random_user(db)
        old_password = random_lower_string()
        await update_user(db, user.id, UserUpdate(password=old_password))
        headers = user_authentication_headers(
            client=client, email=user.email, password=old_password
        )
        new_password = random_lower_string()
        data = {"current_password": old_password, "new_password": new_password}
        response = client.patch(
            f"{settings.API_V1_STR}/users/me/password",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Password updated successfully"

    async def test_update_password_me_incorrect(
        self, client: TestClient, db: AsyncSession
    ) -> None:
        """Test updating password with incorrect current password."""
        user = await create_random_user(db)
        headers = await authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {
            "current_password": "wrongpassword",
            "new_password": random_lower_string(),
        }
        response = client.patch(
            f"{settings.API_V1_STR}/users/me/password",
            headers=headers,
            json=data,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Incorrect password"

    async def test_update_password_me_no_password(
        self, client: TestClient, db: AsyncSession
    ) -> None:
        """Test updating password when user has no password."""
        user = await create_random_user(db)
        headers = await authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        user.hashed_password = None
        await db.flush()
        data = {
            "current_password": random_lower_string(),
            "new_password": random_lower_string(),
        }
        response = client.patch(
            f"{settings.API_V1_STR}/users/me/password",
            headers=headers,
            json=data,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "User has no password"


@pytest.mark.usefixtures("override_dependencies")
class TestUsersSuperuser:
    """Tests for superuser user management endpoints."""

    async def test_read_users(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: AsyncSession,
    ) -> None:
        """Test listing all users as superuser."""
        user1 = await create_random_user(db)
        user2 = await create_random_user(db)
        response = client.get(
            f"{settings.API_V1_STR}/users",
            headers=superuser_token_headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["count"] >= 3
        user_ids = [user["id"] for user in content["data"]]
        assert str(user1.id) in user_ids
        assert str(user2.id) in user_ids

    async def test_read_users_pagination(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: AsyncSession,
    ) -> None:
        """Test listing users with pagination."""
        await create_random_user(db)
        await create_random_user(db)
        response = client.get(
            f"{settings.API_V1_STR}/users?skip=0&limit=1",
            headers=superuser_token_headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["count"] >= 2
        assert len(content["data"]) == 1

    async def test_create_user(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        """Test creating a user as superuser."""
        email = random_email()
        password = random_lower_string()
        data = {
            "email": email,
            "password": password,
            "first_name": "Test",
            "last_name": "User",
        }
        response = client.post(
            f"{settings.API_V1_STR}/users",
            headers=superuser_token_headers,
            json=data,
        )
        assert response.status_code == 201
        content = response.json()
        assert content["email"] == email
        assert content["first_name"] == "Test"
        assert content["last_name"] == "User"
        assert "id" in content

    async def test_create_user_duplicate_email(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: AsyncSession,
    ) -> None:
        """Test creating a user with duplicate email."""
        email = random_email()
        password = random_lower_string()
        await create_user(db, UserCreate(email=email, password=password))
        data = {"email": email, "password": password}
        response = client.post(
            f"{settings.API_V1_STR}/users",
            headers=superuser_token_headers,
            json=data,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Email already registered"

    async def test_create_user_with_emails_enabled(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        """Test creating user with emails enabled."""
        email = random_email()
        password = random_lower_string()
        data = {"email": email, "password": password}
        with (
            patch("app.routes.users.send_email", return_value=None),
            patch("app.config.settings.SMTP_HOST", "smtp.example.com"),
            patch("app.config.settings.EMAILS_FROM_EMAIL", "test@example.com"),
        ):
            response = client.post(
                f"{settings.API_V1_STR}/users",
                headers=superuser_token_headers,
                json=data,
            )
            assert response.status_code == 201

    async def test_read_user_by_id(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: AsyncSession,
    ) -> None:
        """Test getting user by ID as superuser."""
        user = await create_random_user(db)
        response = client.get(
            f"{settings.API_V1_STR}/users/{user.id}",
            headers=superuser_token_headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["id"] == str(user.id)
        assert content["email"] == user.email

    async def test_read_user_by_id_not_found(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        """Test getting non-existent user by ID."""
        fake_id = uuid4()
        response = client.get(
            f"{settings.API_V1_STR}/users/{fake_id}",
            headers=superuser_token_headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"

    async def test_update_user(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: AsyncSession,
    ) -> None:
        """Test updating user as superuser."""
        user = await create_random_user(db)
        data = {"first_name": "Updated", "is_active": False}
        response = client.patch(
            f"{settings.API_V1_STR}/users/{user.id}",
            headers=superuser_token_headers,
            json=data,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["first_name"] == "Updated"
        assert content["is_active"] is False

    async def test_update_user_email_conflict(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: AsyncSession,
    ) -> None:
        """Test updating user email to existing email."""
        user1 = await create_random_user(db)
        user2 = await create_random_user(db)
        data = {"email": user2.email}
        response = client.patch(
            f"{settings.API_V1_STR}/users/{user1.id}",
            headers=superuser_token_headers,
            json=data,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Email already registered"

    async def test_update_user_not_found(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        """Test updating non-existent user."""
        fake_id = uuid4()
        data = {"first_name": "Updated"}
        response = client.patch(
            f"{settings.API_V1_STR}/users/{fake_id}",
            headers=superuser_token_headers,
            json=data,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"

    async def test_delete_user(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: AsyncSession,
    ) -> None:
        """Test deleting user as superuser."""
        user = await create_random_user(db)
        response = client.delete(
            f"{settings.API_V1_STR}/users/{user.id}",
            headers=superuser_token_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "User deleted successfully"

    async def test_delete_user_not_found(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        """Test deleting non-existent user."""
        fake_id = uuid4()
        response = client.delete(
            f"{settings.API_V1_STR}/users/{fake_id}",
            headers=superuser_token_headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"
