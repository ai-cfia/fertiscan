"""Tests for label detail endpoint."""

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
class TestGetLabelDetail:
    """Tests for label detail endpoint."""

    @pytest.mark.asyncio
    async def test_get_label_detail_basic(
        self,
        client: TestClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test getting basic label detail without images."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(label.id)
        assert data["extraction_status"] == label.extraction_status.value
        assert data["verification_status"] == label.verification_status.value
        assert data["extraction_error_message"] == label.extraction_error_message
        assert "created_at" in data
        assert "updated_at" in data
        assert data["images"] == []
        assert data["has_label_data"] is False

    @pytest.mark.asyncio
    async def test_get_label_detail_with_completed_images(
        self,
        client: TestClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test getting label detail with completed images."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image1 = LabelImageFactory(
            label=label,
            file_path=f"labels/{label.id}/image1.jpg",
            display_filename="image1.jpg",
            sequence_order=1,
            status=UploadStatus.completed,
        )
        image2 = LabelImageFactory(
            label=label,
            file_path=f"labels/{label.id}/image2.png",
            display_filename="image2.png",
            sequence_order=2,
            status=UploadStatus.completed,
        )
        for img in [image1, image2]:
            await s3_client.put_object(
                Bucket=settings.STORAGE_BUCKET_NAME,
                Key=img.file_path,
                Body=b"test content",
            )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["images"]) == 2
        assert data["images"][0]["id"] == str(image1.id)
        assert data["images"][0]["display_filename"] == "image1.jpg"
        assert data["images"][0]["storage_file_path"] == image1.file_path
        assert data["images"][0]["sequence_order"] == 1
        assert data["images"][0]["status"] == "completed"
        assert data["images"][0]["presigned_url"] is None
        assert data["images"][1]["id"] == str(image2.id)
        assert data["images"][1]["sequence_order"] == 2
        assert data["images"][1]["presigned_url"] is None

    @pytest.mark.asyncio
    async def test_get_label_detail_with_pending_images(
        self,
        client: TestClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test that pending images don't get presigned URLs."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        completed_image = LabelImageFactory(
            label=label,
            file_path=f"labels/{label.id}/completed.jpg",
            sequence_order=1,
            status=UploadStatus.completed,
        )
        pending_image = LabelImageFactory(
            label=label,
            file_path=f"labels/{label.id}/pending.jpg",
            sequence_order=2,
            status=UploadStatus.pending,
        )
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=completed_image.file_path,
            Body=b"test content",
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["images"]) == 2
        completed = next(
            img for img in data["images"] if img["id"] == str(completed_image.id)
        )
        pending = next(
            img for img in data["images"] if img["id"] == str(pending_image.id)
        )
        assert completed["presigned_url"] is None
        assert pending["presigned_url"] is None

    @pytest.mark.asyncio
    async def test_get_label_detail_images_sorted_by_sequence(
        self,
        client: TestClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test that images are sorted by sequence_order."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image3 = LabelImageFactory(
            label=label,
            file_path=f"labels/{label.id}/image3.jpg",
            sequence_order=3,
            status=UploadStatus.completed,
        )
        image1 = LabelImageFactory(
            label=label,
            file_path=f"labels/{label.id}/image1.jpg",
            sequence_order=1,
            status=UploadStatus.completed,
        )
        image2 = LabelImageFactory(
            label=label,
            file_path=f"labels/{label.id}/image2.jpg",
            sequence_order=2,
            status=UploadStatus.completed,
        )
        for img in [image1, image2, image3]:
            await s3_client.put_object(
                Bucket=settings.STORAGE_BUCKET_NAME,
                Key=img.file_path,
                Body=b"test content",
            )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["images"]) == 3
        assert data["images"][0]["sequence_order"] == 1
        assert data["images"][1]["sequence_order"] == 2
        assert data["images"][2]["sequence_order"] == 3

    @pytest.mark.asyncio
    async def test_get_label_detail_with_label_data(
        self,
        client: TestClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test has_label_data flag when label_data exists."""
        from tests.factories.label_data import LabelDataFactory

        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_label_data"] is True

    def test_get_label_detail_invalid_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting non-existent label returns 404."""
        from uuid import uuid4

        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_id = uuid4()
        response = client.get(
            f"{settings.API_V1_STR}/labels/{invalid_id}",
            headers=headers,
        )
        assert response.status_code == 404

    def test_get_label_detail_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that getting label detail requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        response = client.get(f"{settings.API_V1_STR}/labels/{label.id}")
        assert response.status_code == 401
