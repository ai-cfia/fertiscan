"""Tests for label update endpoint."""

import time
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlmodel import select

from app.config import settings
from app.db.models.label import ReviewStatus
from app.db.models.label_data import LabelData
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

    def test_label_update_create_product(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that completing a label without product creates product."""
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
        assert response.status_code == 200
        data = response.json()
        assert data["review_status"] == "completed"
        assert data["id"] == str(label.id)
        assert data["product_id"] is not None

    def test_product_creation_normalizes_registration_number_whitespace(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that registration_number with whitespace is trimmed when creating product."""
        user = UserFactory()
        label = LabelFactory(created_by=user, standalone=True)
        LabelDataFactory(label=label, registration_number="  REG-12345  ")
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
        db.refresh(label)
        assert label.product_id is not None

        product = db.get(Product, label.product_id)
        assert product is not None
        assert product.registration_number == "REG-12345", (
            "Registration number should be trimmed of whitespace"
        )

    def test_product_creation_case_insensitive_duplicate_check(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that duplicate registration_number check is case-insensitive."""
        user = UserFactory()

        ProductFactory(created_by=user, registration_number="REG-12345")
        db.flush()

        label = LabelFactory(created_by=user, standalone=True)
        LabelDataFactory(label=label, registration_number="reg-12345")
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

        assert response.status_code == 409
        assert "registration number" in response.json()["detail"].lower()

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

    def test_empty_string_registration_number_raises_error(
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
        label.label_data.registration_number = ""
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
        product = ProductFactory(created_by=user, registration_number="reg-12345")
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label, registration_number="reg-12345")
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

        label2 = LabelFactory(created_by=user, standalone=True)
        assert label2.id != label.id
        LabelDataFactory(label=label2, registration_number="reg-12345")
        response_fail = client.patch(
            f"{settings.API_V1_STR}/labels/{label2.id}/review-status",
            json=update_data,
            headers=headers,
        )
        assert response_fail.status_code == 409

    def test_product_update_with_existing_product(
        self,
        client: TestClient,
        db: Session,
    ):
        """Test product update when label with existing product is completed"""
        user = UserFactory()
        product = ProductFactory(
            created_by=user,
            registration_number="REG-12345",
            brand_name_fr="Ancienne Marque",
            name_fr="Ancien Nom",
            brand_name_en="Old Brand",
            name_en="Old Name",
        )
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(
            label=label,
            registration_number="REG-12345",
        )
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

    def test_product_update_with_existing_product_mapping_completed_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test product fields correctly mapped from label_data (brand_name_en/fr → brand_name_en/fr, product_name_en/fr → name_en/fr)"""
        user = UserFactory()
        product = ProductFactory(
            created_by=user,
            registration_number="REG-12345",
            brand_name_fr="Ancienne Marque",
            name_fr="Ancien Nom",
            brand_name_en="Old Brand",
            name_en="Old Name",
        )
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(
            label=label,
            registration_number="REG-12345",
            brand_name_fr="Nouvelle Marque",
            product_name_fr="Nouveau Nom",
            brand_name_en="New Brand",
            product_name_en="New Name",
        )
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

        db.refresh(product)
        assert product.brand_name_en == "New Brand"
        assert product.name_en == "New Name"
        assert product.brand_name_fr == "Nouvelle Marque"
        assert product.name_fr == "Nouveau Nom"

    def test_none_empty_label_data_fields_do_not_overwrite_product_fields_with_none_or_empty(
        self,
        client: TestClient,
        db: Session,
    ):
        """Test None/empty label_data fields are skipped (preserve existing product values)"""
        user = UserFactory()
        product = ProductFactory(
            created_by=user,
            registration_number="REG-12345",
            brand_name_fr="Ancienne Marque",
            name_fr="Ancien Nom",
            brand_name_en="Old Brand",
            name_en="Old Name",
        )
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(
            label=label,
            registration_number="REG-12345",
            brand_name_fr=None,
            product_name_fr="Nouveau Nom",
            brand_name_en="",
            product_name_en="New Name",
        )
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

        db.refresh(product)
        assert product.brand_name_en == "Old Brand"
        assert product.name_en == "New Name"
        assert product.brand_name_fr == "Ancienne Marque"
        assert product.name_fr == "Nouveau Nom"

    def test_product_update_skipped_when_label_data_is_missing(
        self,
        client: TestClient,
        db: Session,
    ):
        """Test product update skipped if label_data is missing (status change still succeeds)"""
        user = UserFactory()
        product = ProductFactory(
            created_by=user,
            registration_number="REG-12345",
            brand_name_fr="Ancienne Marque",
            name_fr="Ancien Nom",
            brand_name_en="Old Brand",
            name_en="Old Name",
        )
        label = LabelFactory(created_by=user, product=product)
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

    def test_product_with_re_completion(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test product update happens on re-completion (completed → in_progress → completed)"""

        user = UserFactory()
        product = ProductFactory(
            created_by=user,
            registration_number="REG-12345",
            brand_name_fr="Ancienne Marque",
            name_fr="Ancien Nom",
            brand_name_en="Old Brand",
            name_en="Old Name",
        )
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(
            label=label,
            registration_number="REG-12345",
            brand_name_fr="Nouvelle Marque",
            product_name_fr="Nouveau Nom",
            brand_name_en="New Brand",
            product_name_en="New Name",
        )
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
        db.flush()
        db.refresh(product)

        update_data = {"review_status": "in_progress"}

        stmt = select(LabelData).where(LabelData.label_id == label.id)
        labelData = db.scalar(stmt)
        assert labelData is not None
        labelData.brand_name_en = "Bad Brand"
        labelData.product_name_en = "Bad Name"
        labelData.brand_name_fr = "Mauvaise Marque"
        labelData.product_name_fr = "Mauvais Nom"
        db.add(labelData)
        db.flush()
        db.refresh(labelData)

        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )

        assert response.status_code == 200
        db.flush()
        db.refresh(product)
        assert product.id is not None
        stmt = select(Product).where(Product.id == product.id)  # type: ignore[assignment]
        product = db.scalar(stmt)
        assert response.json()["review_status"] == "in_progress"
        assert product.brand_name_en == "New Brand"
        assert product.name_en == "New Name"
        assert product.brand_name_fr == "Nouvelle Marque"
        assert product.name_fr == "Nouveau Nom"

        stmt = select(LabelData).where(LabelData.label_id == label.id)
        labelData = db.scalar(stmt)
        assert labelData is not None
        labelData.brand_name_en = "New Brand inc"
        labelData.brand_name_fr = "Nouvelle Marque inc"
        labelData.product_name_en = ""
        labelData.product_name_fr = ""
        db.add(labelData)
        db.flush()
        db.refresh(labelData)

        update_data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        db.flush()
        assert product.id is not None
        db.refresh(product)
        stmt = select(Product).where(Product.id == product.id)  # type: ignore[assignment]

        product = db.scalar(stmt)
        assert product is not None
        assert product.brand_name_en == "New Brand inc"
        assert product.name_en == "New Name"
        assert product.brand_name_fr == "Nouvelle Marque inc"
        assert product.name_fr == "Nouveau Nom"

    def test_product_update_persists_when_review_completion_reverse(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test product update persists when review completion is reversed"""

        user = UserFactory()
        product = ProductFactory(
            created_by=user,
            registration_number="REG-12345",
            brand_name_en="Old Brand",
            name_en="Old Name",
        )
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(
            label=label,
            registration_number="REG-12345",
            brand_name_en="New Brand",
            product_name_en="New Name",
        )
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
        db.refresh(product)
        stmt = select(Product).where(Product.id == product.id)
        product = db.scalar(stmt)
        assert product.brand_name_en == "New Brand"
        assert product.name_en == "New Name"

        update_data = {"review_status": "in_progress"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        db.refresh(product)
        stmt = select(Product).where(Product.id == product.id)
        product = db.scalar(stmt)
        assert product.brand_name_en == "New Brand"
        assert product.name_en == "New Name"

    def test_updated_at_timestamp_updated_on_product(
        self, client: TestClient, db: Session
    ) -> None:
        """Test updated_at timestamp is updated on product
        (with a time sleep of 2 seconds to ensure timestamp difference)"""
        user = UserFactory()
        product = ProductFactory(
            created_by=user,
            registration_number="REG-12345",
            brand_name_en="Old Brand",
            name_en="Old Name",
        )
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(
            label=label,
            registration_number="REG-12345",
            brand_name_en="New Brand",
            product_name_en="New Name",
        )

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
        db.refresh(product)
        stmt = select(Product).where(Product.id == product.id)
        product = db.scalar(stmt)
        assert product is not None
        original_updated_at = product.updated_at
        assert original_updated_at is not None
        time.sleep(2)
        assert time is not None
        assert label.id is not None
        update_data = {"review_status": "completed"}
        stmt = select(LabelData).where(LabelData.label_id == label.id)  # type: ignore[assignment]

        labelData = db.scalar(stmt)
        assert labelData is not None
        labelData.brand_name_en = "New Brand inc"
        labelData.brand_name_fr = "Nouvelle Marque inc"
        labelData.product_name_en = ""
        labelData.product_name_fr = ""
        db.add(labelData)
        db.flush()
        db.refresh(labelData)

        update_data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            json=update_data,
            headers=headers,
        )

        assert response.status_code == 200
        db.flush()
        db.refresh(product)
        stmt = select(Product).where(Product.id == product.id)
        product = db.scalar(stmt)
        assert product.updated_at > original_updated_at
