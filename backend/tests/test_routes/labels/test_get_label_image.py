"""Tests for GET /labels/{label_id}/images/{image_id} endpoint."""

from uuid import uuid4

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
class TestGetLabelImage:
    """Tests for GET /labels/{label_id}/images/{image_id} endpoint."""

    def test_get_label_image_success(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting single label image."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(
            label=label,
            display_filename="test.png",
            sequence_order=1,
            status=UploadStatus.completed,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{image.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(image.id)
        assert data["display_filename"] == "test.png"
        assert data["file_path"] == image.file_path
        assert data["sequence_order"] == 1
        assert data["status"] == "completed"
        assert data["label_id"] == str(label.id)

    def test_get_label_image_invalid_label_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting image with invalid label ID."""
        from uuid import uuid4

        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_label_id = uuid4()
        response = client.get(
            f"{settings.API_V1_STR}/labels/{invalid_label_id}/images/{image.id}",
            headers=headers,
        )
        assert response.status_code == 404

    def test_get_label_image_invalid_image_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting image with invalid image ID."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_image_id = uuid4()
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{invalid_image_id}",
            headers=headers,
        )
        assert response.status_code == 404

    def test_get_label_image_wrong_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting image that belongs to different label."""
        user = UserFactory()
        product1 = ProductFactory(created_by=user)
        product2 = ProductFactory(created_by=user)
        label1 = LabelFactory(created_by=user, product=product1)
        label2 = LabelFactory(created_by=user, product=product2)
        image = LabelImageFactory(label=label1)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label2.id}/images/{image.id}",
            headers=headers,
        )
        assert response.status_code == 404

    def test_get_label_image_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that getting label image requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(label=label)
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{image.id}"
        )
        assert response.status_code == 401
