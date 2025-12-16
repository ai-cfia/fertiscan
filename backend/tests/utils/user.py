"""User test utilities."""

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.controllers.users import create_user, get_user_by_email, update_user
from app.db.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from tests.utils.utils import random_email, random_lower_string


async def create_random_user(db: AsyncSession) -> User:
    """Create a random user."""
    user_in = UserCreate(
        email=random_email(),
        password=random_lower_string(),
    )
    user = await create_user(db, user_in)
    await db.commit()
    return user


def user_authentication_headers(
    *, client: TestClient, email: str, password: str
) -> dict[str, str]:
    data = {"username": email, "password": password}
    response = client.post(f"{settings.API_V1_STR}/login/access-token", data=data)
    result = response.json()
    auth_token = result["access_token"]
    return {"Authorization": f"Bearer {auth_token}"}


async def authentication_token_from_email(
    *, client: TestClient, email: str, db: AsyncSession
) -> dict[str, str]:
    """Return a valid token for the user with given email.

    If the user doesn't exist it is created first.
    """
    password = random_lower_string()
    user = await get_user_by_email(db, email)
    if not user:
        user_in_create = UserCreate(email=email, password=password)
        user = await create_user(db, user_in_create)
        await db.commit()
    else:
        user_in_update = UserUpdate(password=password)
        await update_user(db, user.id, user_in_update)
        await db.commit()
    return user_authentication_headers(client=client, email=email, password=password)
