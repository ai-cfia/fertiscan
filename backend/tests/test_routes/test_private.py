"""Private route tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.controllers.users import get_user_by_email
from tests.utils.utils import random_email, random_lower_string


@pytest.mark.usefixtures("override_dependencies")
class TestCreateUserNoVerification:
    """Tests for creating users without email verification."""

    async def test_create_user_full_data(
        self, client: TestClient, db: AsyncSession
    ) -> None:
        """Test creating user with all fields."""
        email = random_email()
        password = random_lower_string()
        data = {
            "email": email,
            "password": password,
            "first_name": "Test",
            "last_name": "User",
        }
        response = client.post(f"{settings.API_V1_STR}/private/users/", json=data)
        assert response.status_code == 200
        content = response.json()
        assert content["email"] == email
        assert content["first_name"] == "Test"
        assert content["last_name"] == "User"
        assert "id" in content
        assert "hashed_password" not in content
        user = await get_user_by_email(db, email)
        assert user is not None
        assert user.email == email

    async def test_create_user_minimal_data(self, client: TestClient) -> None:
        """Test creating user with only required fields."""
        email = random_email()
        password = random_lower_string()
        data = {"email": email, "password": password}
        response = client.post(f"{settings.API_V1_STR}/private/users/", json=data)
        assert response.status_code == 200
        content = response.json()
        assert content["email"] == email
        assert content["first_name"] is None
        assert content["last_name"] is None

    async def test_create_user_duplicate_email(self, client: TestClient) -> None:
        """Test creating user with duplicate email returns error."""
        email = random_email()
        password = random_lower_string()
        data = {"email": email, "password": password}
        response1 = client.post(f"{settings.API_V1_STR}/private/users/", json=data)
        assert response1.status_code == 200
        response2 = client.post(f"{settings.API_V1_STR}/private/users/", json=data)
        assert response2.status_code == 400
        assert "already exists" in response2.json()["detail"].lower()

    async def test_create_user_invalid_email(self, client: TestClient) -> None:
        """Test creating user with invalid email format."""
        data = {"email": "invalid-email", "password": random_lower_string()}
        response = client.post(f"{settings.API_V1_STR}/private/users/", json=data)
        assert response.status_code == 422

    async def test_create_user_missing_password(self, client: TestClient) -> None:
        """Test creating user without password."""
        data = {"email": random_email()}
        response = client.post(f"{settings.API_V1_STR}/private/users/", json=data)
        assert response.status_code == 422

    async def test_create_user_missing_email(self, client: TestClient) -> None:
        """Test creating user without email."""
        data = {"password": random_lower_string()}
        response = client.post(f"{settings.API_V1_STR}/private/users/", json=data)
        assert response.status_code == 422
