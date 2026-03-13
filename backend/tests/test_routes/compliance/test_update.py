"""Test for update non-compliance data items."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from tests.factories.label import LabelFactory
from tests.factories.NonComplianceDataItem import NonComplianceDataItemFactory
from tests.factories.requirement import RequirementFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
)


@pytest.mark.usefixtures("override_dependencies")
class TestUpdateNonComplianceDataItem:
    """Test for update non-compliance data items."""

    def test_update_non_compliance_data_item(
        self,
        db: Session,
        client: TestClient,
    ):
        """Test updating a non-compliance data item."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        requirement = RequirementFactory.create(session=db)

        non_compliance_data_item = NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            requirement_id=requirement.id,
            note="This is a note.",
            description_en="This is a description.",
            description_fr="Ceci est une description.",
            status="compliant",
        )

        update_data = {
            "note": "This is an updated note.",
            "description_en": "This is an updated description.",
            "description_fr": "Ceci est une description mise à jour.",
            "is_compliant": False,
        }

        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{requirement.id}",
            json=update_data,
            headers=headers,
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["id"] == str(non_compliance_data_item.id)
        assert response_data["label_id"] == str(label.id)
        assert response_data["requirement_id"] == str(requirement.id)
        assert response_data["note"] == "This is an updated note."
        assert response_data["description_en"] == "This is an updated description."
        assert (
            response_data["description_fr"] == "Ceci est une description mise à jour."
        )
        assert response_data["status"] == "compliant"

    def test_update_non_compliance_data_item_not_found(
        self, db: Session, client: TestClient
    ) -> None:
        """Test updating a non-compliance data item that does not exist."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        requirement = RequirementFactory.create(session=db)

        update_data = {
            "note": "This is an updated note.",
            "description_en": "This is an updated description.",
            "description_fr": "Ceci est une description mise à jour.",
            "status": "non_compliant",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{requirement.id}",
            json=update_data,
            headers=headers,
        )

        assert response.status_code == 404

    def test_update_non_compliance_data_item_invalid_label(
        self,
        db: Session,
        client: TestClient,
    ) -> None:
        """Test updating a non-compliance data item with an invalid label."""

        user = UserFactory.create(session=db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        requirement = RequirementFactory.create(session=db)

        update_data = {
            "note": "This is an updated note.",
            "description_en": "This is an updated description.",
            "description_fr": "Ceci est une description mise à jour.",
            "status": "non_compliant",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/labels/{uuid4()}/non_compliance_data_items/{requirement.id}",
            json=update_data,
            headers=headers,
        )

        assert response.status_code == 404

    def test_update_non_compliance_data_item_invalid_requirement(
        self,
        db: Session,
        client: TestClient,
    ) -> None:
        """Test updating a non-compliance data item with an invalid requirement."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        update_data = {
            "note": "This is an updated note.",
            "description_en": "This is an updated description.",
            "description_fr": "Ceci est une description mise à jour.",
            "status": "non_compliant",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{uuid4()}",
            json=update_data,
            headers=headers,
        )

        assert response.status_code == 404

    def test_update_non_compliance_data_item_unauthorized(
        self,
        db: Session,
        client: TestClient,
    ) -> None:
        """Test updating a non-compliance data item without authentication."""

        requirement = RequirementFactory.create(session=db)

        response = client.patch(
            f"{settings.API_V1_STR}/labels/{uuid4()}/non_compliance_data_items/{requirement.id}",
            json={},
        )

        assert response.status_code == 401

    def test_update_non_compliance_data_item_with_one_update(
        self,
        db: Session,
        client: TestClient,
    ) -> None:
        """Test updating a non-compliance data item with only one field to update."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        requirement = RequirementFactory.create(session=db)

        non_compliance_data_item = NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            requirement_id=requirement.id,
            note="This is a note.",
            description_en="This is a description.",
            description_fr="Ceci est une description.",
            status="compliant",
        )

        update_data = {
            "note": "This is an updated note.",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{requirement.id}",
            json=update_data,
            headers=headers,
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["id"] == str(non_compliance_data_item.id)
        assert response_data["label_id"] == str(label.id)
        assert response_data["requirement_id"] == str(requirement.id)
        assert response_data["note"] == "This is an updated note."
        assert response_data["description_en"] == "This is a description."
        assert response_data["description_fr"] == "Ceci est une description."
        assert response_data["status"] == "compliant"
