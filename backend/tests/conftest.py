"""Pytest configuration and shared fixtures."""

from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from aioboto3 import Session as AioSession
from aiomoto import mock_aws
from botocore.config import Config
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from mypy_boto3_s3 import S3Client
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, scoped_session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.db.base import Base
from app.db.init_db import run as init_db
from app.db.session import get_session
from app.main import app
from app.storage import get_s3_client
from app.storage.init import init_storage
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
        poolclass=StaticPool,
    )
test_sessionmaker = sessionmaker(
    test_engine,
    class_=Session,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)
TestSession = scoped_session(test_sessionmaker)


@pytest.fixture(scope="session")
def setup_db() -> Generator[None, None, None]:
    """Create schema and seed initial data once per test session.

    SQLite (local dev): Schema created via metadata.create_all().
    PostgreSQL (ENVIRONMENT=testing): Schema created by migrations before pytest.
    Both: init_db() seeds superuser (idempotent).
    """
    if settings.ENVIRONMENT != "testing":
        Base.metadata.create_all(test_engine)
    with TestSession() as session:
        init_db(session)
    yield


@pytest.fixture(scope="session")
def setup_storage() -> Generator[None, None, None]:
    """Initialize storage: create bucket if needed.

    Real MinIO (USE_MOCKED_STORAGE=False): Bucket created by init_storage().
    aiomoto in-memory: Bucket created per test in s3_client fixture.
    """
    if not settings.USE_MOCKED_STORAGE:
        init_storage()
    yield


@pytest_asyncio.fixture(scope="function")
async def s3_client(setup_storage: None) -> AsyncGenerator[S3Client, None]:  # noqa: ARG001
    """Provide S3 client for tests.

    Real MinIO (USE_MOCKED_STORAGE=False): Uses real client from settings.
    aiomoto in-memory: Uses mocked in-memory S3 (like SQLite in-memory).
    """
    if not settings.USE_MOCKED_STORAGE:
        config = Config(signature_version="s3v4")
        async with AioSession().client(
            "s3",
            endpoint_url=settings.storage_endpoint_url,
            aws_access_key_id=settings.MINIO_ROOT_USER,
            aws_secret_access_key=settings.MINIO_ROOT_PASSWORD.get_secret_value(),
            region_name=settings.STORAGE_REGION,
            config=config,
        ) as client:
            yield client
    else:
        async with mock_aws():
            async with AioSession().client("s3", region_name="ca-central-1") as client:
                await client.create_bucket(
                    Bucket=settings.STORAGE_BUCKET_NAME,
                    CreateBucketConfiguration={"LocationConstraint": "ca-central-1"},
                )
                yield client


@pytest.fixture(scope="function")
def db(setup_db: None) -> Generator[Session, None, None]:  # noqa: ARG001
    """Provide database session for tests. Rolls back and removes session after test."""
    session = TestSession()
    try:
        yield session
    finally:
        session.rollback()
        TestSession.remove()


@pytest_asyncio.fixture(scope="function")
async def override_dependencies(
    db: Session,
    s3_client: S3Client,
) -> AsyncGenerator[None, None]:
    """Override database session and S3 client dependencies for tests."""

    def get_db_session() -> Generator[Session, None, None]:
        yield db

    async def get_test_s3_client() -> AsyncGenerator[S3Client, None]:
        yield s3_client

    app.dependency_overrides[get_session] = get_db_session
    app.dependency_overrides[get_s3_client] = get_test_s3_client
    yield None
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest_asyncio.fixture(scope="function")
async def async_client(
    override_dependencies: None,  # noqa: ARG001
) -> AsyncGenerator[AsyncClient, None]:
    """Provide async HTTP client for tests.

    Depends on override_dependencies to ensure dependency overrides are set up.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture(scope="function")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD.get_secret_value(),
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
