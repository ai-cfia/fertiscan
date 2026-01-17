"""Tests for label image creation endpoint."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from tests.factories.label import LabelFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestCreateLabelImage:
    """Tests for label image creation endpoint."""

    def test_create_label_image_png(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating label image for PNG file."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            headers=headers,
            json={
                "display_filename": "test.png",
                "content_type": "image/png",
                "sequence_order": 1,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["display_filename"] == "test.png"
        assert data["label_id"] == str(label.id)
        assert "file_path" in data
        assert data["file_path"].startswith(f"labels/{label.id}/")
        assert data["file_path"].endswith(".png")
        assert data["current_image_count"] == 1
        assert data["status"] == "pending"

    def test_create_label_image_jpeg(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating label image for JPEG file."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            headers=headers,
            json={
                "display_filename": "photo.jpg",
                "content_type": "image/jpeg",
                "sequence_order": 1,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["display_filename"] == "photo.jpg"
        assert data["file_path"].endswith(".jpg")
        assert data["current_image_count"] == 1

    def test_create_label_image_webp(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating label image for WebP file."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            headers=headers,
            json={
                "display_filename": "image.webp",
                "content_type": "image/webp",
                "sequence_order": 1,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["display_filename"] == "image.webp"
        assert data["file_path"].endswith(".webp")
        assert data["current_image_count"] == 1

    def test_create_label_image_with_existing_images(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test current_image_count reflects existing images."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        for i in range(1, 4):
            LabelImageFactory(label=label, sequence_order=i)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            headers=headers,
            json={
                "display_filename": "new.png",
                "content_type": "image/png",
                "sequence_order": 4,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["current_image_count"] == 4

    def test_create_label_image_invalid_label_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating label image for non-existent label."""

        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_id = uuid4()
        response = client.post(
            f"{settings.API_V1_STR}/labels/{invalid_id}/images",
            headers=headers,
            json={
                "display_filename": "test.png",
                "content_type": "image/png",
                "sequence_order": 1,
            },
        )
        assert response.status_code == 404

    def test_create_label_image_invalid_content_type(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating label image with invalid content type."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            headers=headers,
            json={
                "display_filename": "test.gif",
                "content_type": "image/gif",
                "sequence_order": 1,
            },
        )
        assert response.status_code == 422

    def test_create_label_image_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that creating label image requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            json={
                "display_filename": "test.png",
                "content_type": "image/png",
                "sequence_order": 1,
            },
        )
        assert response.status_code == 401

    def test_create_label_image_enforces_max_limit(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that max 5 images per label limit is enforced."""

        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        for i in range(1, 6):
            LabelImageFactory(label=label, sequence_order=i)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            headers=headers,
            json={
                "display_filename": "sixth.png",
                "content_type": "image/png",
                "sequence_order": 6,
            },
        )
        assert response.status_code == 400
        assert "Maximum" in response.json()["detail"]
        assert "5" in response.json()["detail"]

    def test_create_label_image_completed_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating label image for completed label returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product, completed=True)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images",
            headers=headers,
            json={
                "display_filename": "test.png",
                "content_type": "image/png",
                "sequence_order": 1,
            },
        )
        assert response.status_code == 400
        assert "completed" in response.json()["detail"].lower()
