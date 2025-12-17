"""User test utilities."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from app.controllers.users import create_user, get_user_by_email, update_user
from app.db.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from tests.utils.utils import random_email, random_lower_string


def create_random_user(db: Session) -> User:
    """Create a random user."""
    user_in = UserCreate(
        email=random_email(),
        password=random_lower_string(),
    )
    return create_user(db, user_in)


def user_authentication_headers(
    *,
    client: TestClient,
    email: str,
    password: str,
) -> dict[str, str]:
    data = {"username": email, "password": password}
    response = client.post(f"{settings.API_V1_STR}/login/access-token", data=data)
    result = response.json()
    auth_token = result["access_token"]
    return {"Authorization": f"Bearer {auth_token}"}


def authentication_token_from_email(
    *,
    client: TestClient,
    email: str,
    db: Session,
) -> dict[str, str]:
    """Return a valid token for the user with given email.

    If the user doesn't exist it is created first.
    """
    password = random_lower_string()
    user = get_user_by_email(db, email)
    if not user:
        user_in_create = UserCreate(email=email, password=password)
        create_user(db, user_in_create)
    else:
        user_in_update = UserUpdate(password=password)
        update_user(db, user.id, user_in_update)
    return user_authentication_headers(client=client, email=email, password=password)
