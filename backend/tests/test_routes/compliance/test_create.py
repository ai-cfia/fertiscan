"""Tests creating non-compliance data items"""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.config import settings
from tests.factories.label import LabelFactory
from tests.factories.NonComplianceDataItem import NonComplianceDataItemFactory
from tests.factories.requirement import RequirementFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
)


@pytest.mark.usefixtures("override_dependencies")
class TestCreateCompliance:
    """Tests for creating non-compliance data items."""

    def test_create_compliance(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating a non-compliance data item."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        requirement = RequirementFactory.create(session=db)
        data = {
            "requirement_id": str(requirement.id),
            "status": "non_compliant",
            "note": "This is a note.",
            "description_en": "This is a description in English.",
            "description_fr": "Ceci est une description en français.",
        }
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["requirement_id"] == str(requirement.id)
        assert data["label_id"] == str(label.id)
        assert data["status"] == "non_compliant"
        assert data["note"] == "This is a note."
        assert data["description_en"] == "This is a description in English."
        assert data["description_fr"] == "Ceci est une description en français."

    def test_create_compliance_already_exists(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test to ensure that creating a non-compliance data item for a label and requirement that already has one returns a 409 error."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        requirement = RequirementFactory.create(session=db)
        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            requirement_id=requirement.id,
            status="non_compliant",
            note="This is a note.",
            description_en="This is a description in English.",
            description_fr="Ceci est une description en français.",
        )
        data = {
            "requirement_id": str(requirement.id),
            "status": "non_compliant",
            "note": "This is a note.",
            "description_en": "This is a description in English.",
            "description_fr": "Ceci est une description en français.",
        }
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items",
            headers=headers,
            json=data,
        )
        assert response.status_code == 409

    def test_authentication_required_to_create_compliance(
        self,
        client: TestClient,
    ) -> None:
        """Test that authentication is required to create a non-compliance data item."""
        response = client.post(
            f"{settings.API_V1_STR}/labels/{uuid4()}/non_compliance_data_items", json={}
        )
        assert response.status_code == 401

    def test_label_must_exist_to_create_compliance(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that a non-compliance data item cannot be created for a label that does not exist."""
        user = UserFactory.create(session=db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        requirement = RequirementFactory.create(session=db)
        data = {
            "requirement_id": str(requirement.id),
            "status": "non_compliant",
            "note": "This is a note.",
            "description_en": "This is a description in English.",
            "description_fr": "Ceci est une description en français.",
        }
        response = client.post(
            f"{settings.API_V1_STR}/labels/{uuid4()}/non_compliance_data_items",
            headers=headers,
            json=data,
        )
        assert response.status_code == 404

    def test_requirement_must_exist_to_create_compliance(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that a non-compliance data item cannot be created for a requirement that does not exist."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        data = {
            "requirement_id": str(uuid4()),
            "status": "non_compliant",
            "note": "This is a note.",
            "description_en": "This is a description in English.",
            "description_fr": "Ceci est une description en français.",
        }
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items",
            headers=headers,
            json=data,
        )
        assert response.status_code == 404

    def test_create_the_same_compliance_but_for_two_different_labels(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that creating two non-compliance data items for the same requirement but different labels works."""
        user = UserFactory.create(session=db)
        label1 = LabelFactory.create(session=db, created_by=user)
        label2 = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        requirement = RequirementFactory.create(session=db)
        data1 = {
            "requirement_id": str(requirement.id),
            "status": "non_compliant",
            "note": "This is a note.",
            "description_en": "This is a description in English.",
            "description_fr": "Ceci est une description en français.",
        }
        response1 = client.post(
            f"{settings.API_V1_STR}/labels/{label1.id}/non_compliance_data_items",
            headers=headers,
            json=data1,
        )
        assert response1.status_code == 200

        data2 = {
            "requirement_id": str(requirement.id),
            "status": "non_compliant",
            "note": "This is a note.",
            "description_en": "This is a description in English.",
            "description_fr": "Ceci est une description en français.",
        }
        response2 = client.post(
            f"{settings.API_V1_STR}/labels/{label2.id}/non_compliance_data_items",
            headers=headers,
            json=data2,
        )
        assert response2.status_code == 200

    def test_create_the_same_compliance_on_the_same_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that creating two non-compliance data items for the same requirement and same label returns a 409 error."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        requirement = RequirementFactory.create(session=db)
        data = {
            "requirement_id": str(requirement.id),
            "status": "non_compliant",
            "note": "This is a note.",
            "description_en": "This is a description in English.",
            "description_fr": "Ceci est une description en français.",
        }
        response1 = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items",
            headers=headers,
            json=data,
        )
        assert response1.status_code == 200

        response2 = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items",
            headers=headers,
            json=data,
        )
        assert response2.status_code == 409
