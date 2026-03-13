"""Tests for label update endpoint."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlmodel import select

from app.config import settings
from app.db.models.label import ReviewStatus
from app.db.models.product import Product
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

    def test_update_review_status_to_in_progress_does_not_create_product(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that setting status to in_progress without product_id does not create product."""
        user = LabelFactory().created_by
        label = LabelFactory(created_by=user, standalone=True)
        label_data = LabelDataFactory(label=label)
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
        assert content["product_id"] is None
        db.refresh(label)
        assert label.product_id is None

        stmt = select(Product).where(
            Product.registration_number == label_data.registration_number,
            Product.product_type_id == label.product_type_id,
        )
        created_product = db.scalar(stmt)
        assert created_product is None, (
            "No product should be created when setting status to in_progress"
        )

    def test_update_to_completed_without_product_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that completing a label without product linkage fails with 400."""
        user = UserFactory()
        label = LabelFactory(created_by=user, standalone=True)
        LabelDataFactory(label=label)
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
        assert response.status_code == 400
        assert "product" in response.json()["detail"].lower()

    def test_update_review_status_to_completed_with_product_succeeds(
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

    def test_idempotent_completion(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that re-completing an already completed label succeeds (idempotent)."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(
            created_by=user, product=product, review_status=ReviewStatus.completed
        )
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
        assert response.json()["review_status"] == "completed"

    def test_status_change_from_completed_to_in_progress(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test changing status from completed back to in_progress."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(
            created_by=user, product=product, review_status=ReviewStatus.completed
        )
        LabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"review_status": "in_progress"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )

        assert response.status_code == 200
        assert response.json()["review_status"] == "in_progress"
