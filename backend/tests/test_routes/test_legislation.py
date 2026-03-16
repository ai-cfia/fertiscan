"""Legislation routes tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from tests.factories.legislation import LegislationFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestReadLegislations:
    """Tests for read Legislations route."""

    def test_read_legislations_list(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing legislations."""
        user = UserFactory.create(session=db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        LegislationFactory.create(session=db)
        response = client.get(f"{settings.API_V1_STR}/legislations", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_read_legislations_filter_by_product_type(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing legislations filtered by product_type."""
        user = UserFactory.create(session=db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        leg = LegislationFactory.create(session=db)
        response = client.get(
            f"{settings.API_V1_STR}/legislations",
            params={"product_type": leg.product_type.code},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any(str(item["id"]) == str(leg.id) for item in data)
