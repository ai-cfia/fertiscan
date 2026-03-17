"""Tests for label creation endpoint."""

from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.config import settings
from app.db.models.label import Label
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestCreateLabel:
    """Tests for label creation endpoint."""

    def test_create_label_without_product(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating standalone label without product."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels",
            headers=headers,
            json={"product_type": "fertilizer"},
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        label_id = UUID(data["id"])
        label = db.get(Label, label_id)
        assert label is not None
        assert label.product_id is None
        assert label.product_type.code == "fertilizer"

    def test_create_label_with_product(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating label linked to product."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels",
            headers=headers,
            json={"product_type": "fertilizer", "product_id": str(product.id)},
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        label_id = UUID(data["id"])
        label = db.get(Label, label_id)
        assert label is not None
        assert label.product_id == product.id

    def test_create_label_invalid_product_type(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating label with invalid product type."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels",
            headers=headers,
            json={"product_type": "invalid"},
        )
        assert response.status_code == 400

    def test_create_label_invalid_product_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating label with non-existent product ID returns 400."""

        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_product_id = uuid4()
        response = client.post(
            f"{settings.API_V1_STR}/labels",
            headers=headers,
            json={"product_type": "fertilizer", "product_id": str(invalid_product_id)},
        )
        assert response.status_code == 400

    def test_create_label_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that creating label requires authentication."""
        response = client.post(
            f"{settings.API_V1_STR}/labels",
            json={"product_type": "fertilizer"},
        )
        assert response.status_code == 401
