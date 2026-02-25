"""Test for reading non-compliance data items."""

from datetime import datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlmodel import select

from app.config import settings
from app.db.models.rule import Rule
from tests.factories.label import LabelFactory
from tests.factories.NonComplianceDataItem import NonComplianceDataItemFactory
from tests.factories.rule import RuleFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
)


@pytest.mark.usefixtures("override_dependencies")
class TestFilterCompliances:
    """Tests for filtering non-compliance data items."""

    def test_filter_compliances_by_note(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering non-compliance data items by note."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        rule1 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule2 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule3 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule1.id,
            note="This is a note.",
        )
        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule2.id,
            note="This is a good day.",
        )

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule3.id,
            note="This is another note.",
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?note=another",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["note"] == "This is another note."

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?note=note",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2

    def test_filter_compliances_by_note_no_match(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering non-compliance data items by note with no match."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        rule1 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule2 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule3 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule1.id,
            note="This is a note.",
        )
        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule2.id,
            note="This is a good day.",
        )

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule3.id,
            note="This is another note.",
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?note=nonexistent",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0

    def test_filter_compliance_by_description(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering non-compliance data items by description."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        rule1 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule2 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule3 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule1.id,
            description_en="This is a description.",
            description_fr="Ceci est une description.",
        )
        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule2.id,
            description_en="This is a good day.",
            description_fr="C'est une bonne journée.",
        )

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule3.id,
            description_en="This is another description.",
            description_fr="Ceci est une autre description.",
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?description_en=another",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["description_en"] == "This is another description."

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?description_fr=description",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?description_fr=nonexistent",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0

    def test_filter_compliance_by_is_compliant(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering non-compliance data items by is_compliant."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        rule1 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule2 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule3 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule1.id,
            is_compliant=True,
        )
        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule2.id,
            is_compliant=False,
        )

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule3.id,
            is_compliant=False,
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?is_compliant=true",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is True

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?is_compliant=false",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?is_compliant=nonexistent",
            headers=headers,
        )
        assert response.status_code == 422

    def test_filter_compliance_by_date_range_with_minutes_and_seconds(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering non-compliance data items by date range."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        rule1 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule2 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule3 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule1.id,
            created_at=datetime(2022, 1, 1),
            updated_at=datetime(2022, 2, 1),
        )
        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule2.id,
            is_compliant=False,
            created_at=datetime(2022, 3, 1),
            updated_at=datetime(2022, 4, 1),
        )

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule3.id,
            is_compliant=False,
            created_at=datetime(2022, 1, 2),
            updated_at=datetime(2022, 1, 3),
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?start_updated_at=2022-01-01T00:00:00&end_updated_at=2022-02-20T23:59:59",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2

    def test_filter_compliance_by_invalid_date_range(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering non-compliance data items by invalid date range."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?start_created_at=2022-02-01T00:00:00&end_created_at=2022-01-31T23:59:59",
            headers=headers,
        )
        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Invalid date range"

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?start_updated_at=2022-02-01T00:00:00&end_updated_at=2022-01-31T23:59:59",
            headers=headers,
        )
        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Invalid date range"

    def test_authentication_required_to_filter_compliance(
        self,
        client: TestClient,
    ) -> None:
        """Test that authentication is required to create a non-compliance data item."""
        response = client.post(
            f"{settings.API_V1_STR}/labels/{uuid4()}/non_compliance_data_items", json={}
        )
        assert response.status_code == 401

    def test_filter_compliance_by_all(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering non-compliance data items by all filters."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        rule1 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule2 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule1.id,
            note="This is a note.",
            description_en="This is a description.",
            description_fr="Ceci est une description.",
            is_compliant=True,
            created_at=datetime(2022, 1, 1),
            updated_at=datetime(2022, 2, 1),
        )
        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule2.id,
            note="This is another note.",
            description_en="This is another description.",
            description_fr="Ceci est une autre description.",
            is_compliant=False,
            created_at=datetime(2022, 3, 1),
            updated_at=datetime(2022, 4, 1),
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?note=note&description_en=description&is_compliant=true&start_created_at=2022-01-01T00:00:00&end_created_at=2022-01-31T23:59:59&start_updated_at=2022-01-01T00:00:00&end_updated_at=2022-02-28T23:59:59",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1

    def test_paginate_compliances_with_no_filters(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test paginating non-compliance data items with no filters."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        rule1 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule2 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")
        rule3 = RuleFactory.create(session=db, reference_number=f"FzR: TEST-{uuid4()}")

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule1.id,
            is_compliant=True,
        )
        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule2.id,
            is_compliant=False,
        )

        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule3.id,
            is_compliant=False,
        )
        # =======================================Pagination test========================================
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?limit=1",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items?limit=10&offset=1",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2


@pytest.mark.usefixtures("override_dependencies")
class TestComplianceReadById:
    """Tests for reading non-compliance data items by label and rule ids."""

    def test_read_compliance_by_label_and_rule_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading a non-compliance data item by label and rule ids."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None
        non_compliance_data_item = NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule1.id,
            note="This is a note.",
            description_en="This is a description.",
            description_fr="Ceci est une description.",
            is_compliant=True,
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{rule1.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(non_compliance_data_item.id)
        assert data["label_id"] == str(label.id)
        assert data["rule_id"] == str(rule1.id)
        assert data["note"] == "This is a note."
        assert data["description_en"] == "This is a description."
        assert data["description_fr"] == "Ceci est une description."
        assert data["is_compliant"] is True

    def test_read_compliance_by_label_and_rule_id_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading a non-compliance data item by label and rule ids that do not exist."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{uuid4()}",
            headers=headers,
        )
        assert response.status_code == 404

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None

        response = client.get(
            f"{settings.API_V1_STR}/labels/{uuid4()}/non_compliance_data_items/{rule1.id}",
            headers=headers,
        )
        assert response.status_code == 404

    def test_compliance_read_by_label_and_rule_id_authentication_required(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that authentication is required to read a non-compliance data item by label and rule ids."""
        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None

        response = client.get(
            f"{settings.API_V1_STR}/labels/{uuid4()}/non_compliance_data_items/{rule1.id}"
        )
        assert response.status_code == 401

    def test_read_compliance_not_found_by_label_and_rule_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading a non-compliance data item by label and rule ids that do not exist."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{rule1.id}",
            headers=headers,
        )
        assert response.status_code == 404
