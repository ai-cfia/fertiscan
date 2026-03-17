"""Tests for GET /labels/{label_id}/images/{image_id}/presigned-download-url endpoint."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.config import settings
from app.db.models.label_image import UploadStatus
from tests.factories.label import LabelFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestGetPresignedDownloadUrl:
    """Tests for GET /labels/{label_id}/images/{image_id}/presigned-download-url endpoint."""

    @pytest.mark.asyncio
    async def test_get_presigned_download_url_success(
        self,
        client: TestClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test getting presigned download URL for completed image."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(
            label=label,
            status=UploadStatus.completed,
            file_path="labels/test-uuid/image.png",
        )
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=image.file_path,
            Body=b"test content",
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{image.id}/presigned-download-url",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "presigned_url" in data
        assert data["presigned_url"].startswith("http")

    @pytest.mark.asyncio
    async def test_get_presigned_download_url_pending_image(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that pending images cannot get presigned download URL."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(
            label=label,
            status=UploadStatus.pending,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{image.id}/presigned-download-url",
            headers=headers,
        )
        assert response.status_code == 400

    def test_get_presigned_download_url_invalid_image_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting presigned URL for non-existent image."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_image_id = uuid4()
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{invalid_image_id}/presigned-download-url",
            headers=headers,
        )
        assert response.status_code == 404

    def test_get_presigned_download_url_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that getting presigned download URL requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(label=label, status=UploadStatus.completed)
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{image.id}/presigned-download-url"
        )
        assert response.status_code == 401
