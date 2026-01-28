"""Tests for label update endpoint."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models.label import ReviewStatus
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestUpdateLabel:
    """Tests for updating Label via PATCH /labels/{id}."""

    def test_update_label_product_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating label product_id."""
        user = UserFactory()
        product1 = ProductFactory(created_by=user)
        product2 = ProductFactory(created_by=user)
        label = LabelFactory(
            created_by=user, product=product1, review_status=ReviewStatus.not_started
        )

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"product_id": str(product2.id)}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["product_id"] == str(product2.id)
        assert data["id"] == str(label.id)

    def test_update_label_empty_update(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating label with empty update data returns original."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(
            created_by=user, product=product, review_status=ReviewStatus.not_started
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}",
            json={},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["review_status"] == "not_started"
        assert data["id"] == str(label.id)

    def test_update_label_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating non-existent label returns 404."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_id = uuid4()
        update_data = {"product_id": str(product.id)}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{invalid_id}",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 404

    def test_update_label_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that updating label requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        update_data = {"product_id": str(product.id)}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}",
            json=update_data,
        )
        assert response.status_code == 401

    def test_update_label_completed_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating completed label via PATCH /labels/{id} returns 400."""
        user = UserFactory()
        product1 = ProductFactory(created_by=user)
        product2 = ProductFactory(created_by=user)
        label = LabelFactory(
            created_by=user, product=product1, review_status=ReviewStatus.completed
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"product_id": str(product2.id)}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 400
        assert "completed" in response.json()["detail"].lower()


@pytest.mark.usefixtures("override_dependencies")
class TestUpdateLabelReviewStatus:
    """Tests for updating a label’s review_status and automatically creating a product via PATCH /labels/{id}/review-status."""

    def test_update_label_review_status(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating label review_status."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["review_status"] == "completed"
        assert data["id"] == str(label.id)

    def test_update_review_status_to_completed_without_product(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that completing a label without product_id returns 400."""
        user = LabelFactory().created_by
        label = LabelFactory(created_by=user, standalone=True)
        LabelDataFactory(label=label)
        assert label.product_id is None
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            headers=headers,
            json=data,
        )
        assert response.status_code == 400
        assert "product" in response.json()["detail"].lower()

    def test_update_review_status_to_completed_with_product(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that completing a label with product_id succeeds."""
        user = LabelFactory().created_by
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        assert label.product_id is not None
        assert label.product_id == product.id
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["review_status"] == "completed"

    def test_update_review_status_to_in_progress_without_product(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that setting status to in_progress without product_id succeeds."""
        user = LabelFactory().created_by
        label = LabelFactory(created_by=user, standalone=True)
        LabelDataFactory(label=label)
        assert label.product_id is None
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {"review_status": "in_progress"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["review_status"] == "in_progress"

    def test_update_review_status_to_not_started_without_product(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that setting status to not_started without product_id succeeds."""
        user = LabelFactory().created_by
        label = LabelFactory(created_by=user, standalone=True, in_progress=True)
        LabelDataFactory(label=label)
        assert label.product_id is None
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {"review_status": "not_started"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["review_status"] == "not_started"

    def label_update_create_product(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that completing a label without product creates product."""
        user = UserFactory()
        label = LabelFactory(created_by=user, standalone=True)
        assert label.product_id is None
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["review_status"] == "completed"
        assert data["id"] == str(label.id)
        assert data["product_id"] is not None

    def test_missing_data_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that completing a label without label data returns 400."""
        user = UserFactory()
        label = LabelFactory(created_by=user, standalone=True)
        assert label.product_id is None
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        label.label_data = None
        update_data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )

        assert response.status_code == 400

    def test_missing_registration_number(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that completing a label without registration number returns 422."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        assert label.product_id is not None
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        label.label_data.registration_number = None
        update_data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )

        assert response.status_code == 422

    def test_update_two_same_labels_to_completed(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that updating two labels with same registration number to completed fails on second."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        response_fail = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )
        assert response_fail.status_code == 400
