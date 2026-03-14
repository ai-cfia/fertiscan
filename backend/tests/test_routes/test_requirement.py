"""Rule routes tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from tests.factories.legislation import LegislationFactory
from tests.factories.requirement import RequirementFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
)


@pytest.mark.usefixtures("override_dependencies")
class TestReadRequirement:
    """Tests for read Requirement route."""

    def test_read_requirement_by_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading a requirement by ID."""
        user = UserFactory.create(session=db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        requirement = RequirementFactory.create(session=db)
        response = client.get(
            f"{settings.API_V1_STR}/requirements/{requirement.id}", headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(requirement.id)
        assert data["title_en"] == requirement.title_en
        assert data["title_fr"] == requirement.title_fr

    def test_read_requirements_filter_by_legislation_ids(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing requirements filtered by legislation_ids."""
        user = UserFactory.create(session=db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        leg1 = LegislationFactory.create(session=db)
        leg2 = LegislationFactory.create(session=db)
        req1 = RequirementFactory.create(legislation=leg1, session=db)
        RequirementFactory.create(legislation=leg2, session=db)
        response = client.get(
            f"{settings.API_V1_STR}/requirements",
            params=[("legislation_ids", str(leg1.id))],
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        ids = [item["id"] for item in data["items"]]
        assert str(req1.id) in ids
