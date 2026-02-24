from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlmodel import select

from app.config import settings
from app.db.models.label import Label
from app.db.models.non_compliance_data_item import NonComplianceDataItem
from app.db.models.rule import Rule
from tests.factories.label import LabelFactory
from tests.factories.NonComplianceDataItem import NonComplianceDataItemFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
)


@pytest.mark.usefixtures("override_dependencies")
class TestDeleteNonComplianceDataItem:
    """Test for delete non-compliance data items."""

    def test_delete_non_compliance_data_item(
        self,
        db: Session,
        client: TestClient,
    ):
        """Test deleting a non-compliance data item."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None
        NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule1.id,
            note="This is a note.",
            description_en="This is a description.",
            description_fr="Ceci est une description.",
            is_compliant=True,
        )

        response = client.delete(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{rule1.id}",
            headers=headers,
        )

        assert response.status_code == 200

        stmt = select(NonComplianceDataItem).where(
            NonComplianceDataItem.label_id == label.id,
            NonComplianceDataItem.rule_id == rule1.id,
        )
        deleted_item = db.scalars(stmt).first()
        assert deleted_item is None

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None

        stmt = select(Label).where(Label.id == label.id)
        label_from_db = db.scalars(stmt).first()
        assert label_from_db is not None

    def test_delete_invalid_label_id(
        self,
        db: Session,
        client: TestClient,
    ) -> None:
        """Test deleting a non-compliance data item with an invalid label id."""

        user = UserFactory.create(session=db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        invalid_label_id = uuid4()
        rule_id = uuid4()

        response = client.delete(
            f"{settings.API_V1_STR}/labels/{invalid_label_id}/non_compliance_data_items/{rule_id}",
            headers=headers,
        )

        assert response.status_code == 404

    def test_delete_invalid_rule_id(
        self,
        db: Session,
        client: TestClient,
    ) -> None:
        """Test deleting a non-compliance data item with an invalid rule id."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        invalid_rule_id = uuid4()

        response = client.delete(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{invalid_rule_id}",
            headers=headers,
        )

        assert response.status_code == 404

    def test_delete_missing_non_compliance_data_item(
        self,
        db: Session,
        client: TestClient,
    ) -> None:
        """Test deleting a non-compliance data item that does not exist."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None

        response = client.delete(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{rule1.id}",
            headers=headers,
        )

        assert response.status_code == 404

    def test_delete_missing_authentication(
        self,
        db: Session,
        client: TestClient,
    ) -> None:
        """Test deleting a non-compliance data item without authentication."""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, created_by=user)

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None

        response = client.delete(
            f"{settings.API_V1_STR}/labels/{label.id}/non_compliance_data_items/{rule1.id}",
            headers={},
        )

        assert response.status_code == 401
