"""Pytest configuration and shared fixtures."""

from collections.abc import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.db.base import Base
from app.db.init_db import init_db
from app.db.session import get_async_session
from app.main import app
from tests.utils.user import authentication_token_from_email

# Use app-configured DB in testing; otherwise in-memory SQLite
if settings.ENVIRONMENT == "testing":
    test_engine = create_async_engine(
        str(settings.SQLALCHEMY_DATABASE_URI),
        echo=False,
        pool_pre_ping=True,
    )
else:
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


@pytest.fixture(scope="function")  # type: ignore[misc]
async def override_dependencies(db: AsyncSession) -> AsyncGenerator[None, None]:
    """Override database session dependency for tests."""

    async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
        yield db

    app.dependency_overrides[get_async_session] = get_db_session
    yield None
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")  # type: ignore[misc]
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Provide database session for tests wrapped in a transaction that rolls back.

    CI (PostgreSQL): Schema and superuser created by test-cov.sh before pytest.
    Local (SQLite): Schema created here, superuser initialized per test.
    All changes are rolled back after each test for isolation.
    """
    async with test_engine.connect() as conn:
        trans = await conn.begin()
        if settings.ENVIRONMENT != "testing":
            await conn.run_sync(Base.metadata.create_all)
        async with AsyncSession(bind=conn, expire_on_commit=False) as session:
            if settings.ENVIRONMENT != "testing":
                await init_db(session)
                await session.commit()
            yield session
        await trans.rollback()


@pytest.fixture(scope="function")  # type: ignore[misc]
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")  # type: ignore[misc]
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    response = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = response.json()
    a_token = tokens["access_token"]
    return {"Authorization": f"Bearer {a_token}"}


@pytest.fixture(scope="function")  # type: ignore[misc]
async def normal_user_token_headers(
    client: TestClient, db: AsyncSession
) -> dict[str, str]:
    email = getattr(settings, "EMAIL_TEST_USER", "test@example.com")
    return await authentication_token_from_email(client=client, email=email, db=db)
