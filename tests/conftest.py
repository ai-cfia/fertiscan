"""Pytest configuration and shared fixtures."""

from collections.abc import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.db.init_db import init_db
from app.db.models.item import Item
from app.db.models.user import User
from app.db.session import get_async_session
from app.main import app
from tests.utils.user import authentication_token_from_email

# Create test engine and sessionmaker for SQLite in-memory
test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    echo=False,
    connect_args={"check_same_thread": False},
)
test_sessionmaker = async_sessionmaker[AsyncSession](
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_test_session() -> AsyncGenerator[AsyncSession, None]:
    """Test session dependency using SQLite in-memory."""
    async with test_sessionmaker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest.fixture(scope="session", autouse=True)  # type: ignore[misc]
def override_dependencies() -> Generator[None, None, None]:
    """Override database session dependency for tests."""

    app.dependency_overrides[get_async_session] = get_test_session
    yield None
    app.dependency_overrides.clear()


@pytest.fixture(scope="session", autouse=True)  # type: ignore[misc]
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with test_sessionmaker() as session:
        await init_db(session)
        await session.commit()
        yield session
        await session.execute(delete(Item))
        await session.execute(delete(User))
        await session.commit()


@pytest.fixture(scope="module")  # type: ignore[misc]
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")  # type: ignore[misc]
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    response = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = response.json()
    a_token = tokens["access_token"]
    return {"Authorization": f"Bearer {a_token}"}


@pytest.fixture(scope="module")  # type: ignore[misc]
async def normal_user_token_headers(
    client: TestClient, db: AsyncSession
) -> dict[str, str]:
    email = getattr(settings, "EMAIL_TEST_USER", "test@example.com")
    return await authentication_token_from_email(client=client, email=email, db=db)
