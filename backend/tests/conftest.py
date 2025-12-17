"""Pytest configuration and shared fixtures."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.db.base import Base
from app.db.init_db import init_db
from app.db.session import get_session
from app.main import app
from tests.utils.user import authentication_token_from_email

# Use app-configured DB in testing; otherwise in-memory SQLite
if settings.ENVIRONMENT == "testing":
    test_engine = create_engine(
        str(settings.SQLALCHEMY_DATABASE_URI),
        echo=False,
        pool_pre_ping=True,
    )
else:
    test_engine = create_engine(
        "sqlite:///:memory:",
        echo=False,
        connect_args={"check_same_thread": False},
    )
test_sessionmaker = sessionmaker(
    test_engine,
    class_=Session,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="function")
def override_dependencies(db: Session) -> Generator[None, None, None]:
    """Override database session dependency for tests."""

    def get_db_session() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[get_session] = get_db_session
    yield None
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Provide database session for tests wrapped in a transaction that rolls back.

    CI (PostgreSQL): Schema and superuser created by test-cov.sh before pytest.
    Local (SQLite): Schema created here, superuser initialized per test.
    All changes are rolled back after each test for isolation.
    """
    with test_engine.connect() as conn:
        trans = conn.begin()
        if settings.ENVIRONMENT != "testing":
            Base.metadata.create_all(conn)
        with Session(bind=conn, expire_on_commit=False) as session:
            if settings.ENVIRONMENT != "testing":
                init_db(session)
                session.commit()
            yield session
        trans.rollback()


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    response = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = response.json()
    a_token = tokens["access_token"]
    return {"Authorization": f"Bearer {a_token}"}


@pytest.fixture(scope="function")
def normal_user_token_headers(
    client: TestClient,
    db: Session,
) -> dict[str, str]:
    email = getattr(settings, "EMAIL_TEST_USER", "test@example.com")
    return authentication_token_from_email(client=client, email=email, db=db)
