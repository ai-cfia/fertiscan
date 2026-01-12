"""Tests for GET /labels/{label_id}/images endpoint."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models.label_image import UploadStatus
from tests.factories.label import LabelFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestListLabelImages:
    """Tests for GET /labels/{label_id}/images endpoint."""

    def test_list_label_images_empty(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing images when label has none."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_list_label_images_with_images(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing images for label with multiple images."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image1 = LabelImageFactory(
            label=label, sequence_order=1, status=UploadStatus.completed
        )
        image2 = LabelImageFactory(
            label=label, sequence_order=2, status=UploadStatus.pending
        )
        image3 = LabelImageFactory(
            label=label, sequence_order=3, status=UploadStatus.completed
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["id"] == str(image1.id)
        assert data[0]["sequence_order"] == 1
        assert data[1]["id"] == str(image2.id)
        assert data[1]["sequence_order"] == 2
        assert data[2]["id"] == str(image3.id)
        assert data[2]["sequence_order"] == 3
        assert all(img["presigned_url"] is None for img in data)

    def test_list_label_images_sorted_by_sequence(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that images are sorted by sequence_order."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image3 = LabelImageFactory(label=label, sequence_order=3)
        image1 = LabelImageFactory(label=label, sequence_order=1)
        image2 = LabelImageFactory(label=label, sequence_order=2)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["id"] == str(image1.id)
        assert data[0]["sequence_order"] == 1
        assert data[1]["id"] == str(image2.id)
        assert data[1]["sequence_order"] == 2
        assert data[2]["id"] == str(image3.id)
        assert data[2]["sequence_order"] == 3

    def test_list_label_images_invalid_label_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing images for non-existent label."""
        from uuid import uuid4

        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_id = uuid4()
        response = client.get(
            f"{settings.API_V1_STR}/labels/{invalid_id}/images",
            headers=headers,
        )
        assert response.status_code == 404

    def test_list_label_images_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that listing label images requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        response = client.get(f"{settings.API_V1_STR}/labels/{label.id}/images")
        assert response.status_code == 401
