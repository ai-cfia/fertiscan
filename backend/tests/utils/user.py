"""User test utilities."""

from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlmodel import Session, select

from app.config import settings
from app.controllers.users import create_user, update_user
from app.db.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from tests.utils import fake


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


async def user_authentication_headers_async(
    *,
    client: AsyncClient,
    email: str,
    password: str,
) -> dict[str, str]:
    data = {"username": email, "password": password}
    response = await client.post(f"{settings.API_V1_STR}/login/access-token", data=data)
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
    password = fake.password()
    user = db.exec(select(User).where(User.email == email)).first()
    if not user:
        user_in_create = UserCreate(email=email, password=password)
        create_user(db, user_in_create)
    else:
        user_in_update = UserUpdate(password=password)
        update_user(db, user, user_in_update)
    return user_authentication_headers(client=client, email=email, password=password)


async def authentication_token_from_email_async(
    *,
    client: AsyncClient,
    email: str,
    db: Session,
) -> dict[str, str]:
    """Return a valid token for the user with given email (async version).

    If the user doesn't exist it is created first.
    """
    password = fake.password()
    user = db.exec(select(User).where(User.email == email)).first()
    if not user:
        user_in_create = UserCreate(email=email, password=password)
        create_user(db, user_in_create)
    else:
        user_in_update = UserUpdate(password=password)
        update_user(db, user, user_in_update)
    return await user_authentication_headers_async(
        client=client, email=email, password=password
    )
