"""Rule routes tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlmodel import select

from app.config import settings
from app.db.models.rule import Rule
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
)


@pytest.mark.usefixtures("override_dependencies")
class TestRuleRoutes:
    """Tests for rule routes."""

    def test_get_rules(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting rules."""
        user = UserFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/rules/",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 1

    def test_get_rule_by_reference_number(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting a rule by reference number."""
        user = UserFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/rules?reference_number=FzR%3A+15.(1)(i)",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["reference_number"] == "FzR: 15.(1)(i)"

        stmt = select(Rule).where(
            Rule.reference_number == data["items"][0]["reference_number"]
        )
        rule = db.scalars(stmt).first()
        assert rule is not None
        assert rule.reference_number == "FzR: 15.(1)(i)"

    def test_authentication_required_for_rules(
        self,
        client: TestClient,
    ) -> None:
        """Test that authentication is required to access rules."""
        response = client.get(f"{settings.API_V1_STR}/rules")
        assert response.status_code == 401

    def test_get_rule_by_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting a rule by id."""
        user = UserFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule = db.scalars(stmt).first()
        assert rule is not None

        response = client.get(
            f"{settings.API_V1_STR}/rules?rule_id={rule.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items"][0]["reference_number"] == "FzR: 16.(1)(j)"
