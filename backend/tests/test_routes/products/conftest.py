import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def auth_headers(client: TestClient, db: Session, user):
    return authentication_token_from_email(client=client, email=user.email, db=db)
