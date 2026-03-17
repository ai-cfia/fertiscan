"""Tests for label image upload completion endpoint."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlmodel import Session

from app.config import settings
from app.db.models.label_image import UploadStatus
from tests.factories.label import LabelFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
    authentication_token_from_email_async,
)


@pytest.mark.usefixtures("override_dependencies")
class TestCompleteLabelImageUpload:
    """Tests for label image upload completion endpoint."""

    @pytest.mark.asyncio
    async def test_complete_upload_success(
        self,
        async_client: AsyncClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test completing upload successfully."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        label_image = LabelImageFactory(
            label=label,
            status=UploadStatus.pending,
            file_path="labels/test-uuid/image.png",
        )
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=label_image.file_path,
            Body=b"test image content",
        )
        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        response = await async_client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images/complete",
            headers=headers,
            json={"storage_file_path": label_image.file_path},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(label_image.id)
        assert data["label_id"] == str(label.id)
        db.refresh(label_image)
        assert label_image.status == UploadStatus.completed

    @pytest.mark.asyncio
    async def test_complete_upload_file_not_found(
        self,
        async_client: AsyncClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test completing upload when file doesn't exist in storage."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        label_image = LabelImageFactory(
            label=label,
            status=UploadStatus.pending,
            file_path="labels/test-uuid/missing.png",
        )
        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        response = await async_client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images/complete",
            headers=headers,
            json={"storage_file_path": label_image.file_path},
        )
        assert response.status_code == 404
        assert "not found in storage" in response.json()["detail"].lower()

    def test_complete_upload_pending_image_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test completing upload when pending LabelImage doesn't exist."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images/complete",
            headers=headers,
            json={"storage_file_path": "labels/test-uuid/nonexistent.png"},
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_complete_upload_already_completed(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test completing upload when image is already completed."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        label_image = LabelImageFactory(
            label=label,
            status=UploadStatus.completed,
            file_path="labels/test-uuid/image.png",
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images/complete",
            headers=headers,
            json={"storage_file_path": label_image.file_path},
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_complete_upload_invalid_label_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test completing upload for non-existent label."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_id = uuid4()
        response = client.post(
            f"{settings.API_V1_STR}/labels/{invalid_id}/images/complete",
            headers=headers,
            json={"storage_file_path": "labels/test-uuid/image.png"},
        )
        assert response.status_code == 404

    def test_complete_upload_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that completing upload requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/images/complete",
            json={"storage_file_path": "labels/test-uuid/image.png"},
        )
        assert response.status_code == 401

    def test_complete_upload_wrong_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test completing upload with storage_file_path from different label."""
        user = UserFactory()
        product1 = ProductFactory(created_by=user)
        product2 = ProductFactory(created_by=user)
        label1 = LabelFactory(created_by=user, product=product1)
        label2 = LabelFactory(created_by=user, product=product2)
        label_image = LabelImageFactory(
            label=label1,
            status=UploadStatus.pending,
            file_path="labels/test-uuid/image.png",
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label2.id}/images/complete",
            headers=headers,
            json={"storage_file_path": label_image.file_path},
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
