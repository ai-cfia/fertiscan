"""Tests for DELETE /labels/{label_id}/images/{image_id} endpoint."""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models.label_image import LabelImage
from tests.factories.label import LabelFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
    authentication_token_from_email_async,
)


@pytest.mark.usefixtures("override_dependencies")
class TestDeleteLabelImage:
    """Tests for DELETE /labels/{label_id}/images/{image_id} endpoint."""

    @pytest.mark.asyncio
    async def test_delete_label_image_success(
        self,
        async_client: AsyncClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test deleting label image successfully."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(
            label=label,
            file_path="labels/test-uuid/image.png",
            sequence_order=1,
        )
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=image.file_path,
            Body=b"test content",
        )
        image_id = image.id
        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        response = await async_client.delete(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{image_id}",
            headers=headers,
        )
        assert response.status_code == 204
        assert db.get(LabelImage, image_id) is None
        from botocore.exceptions import ClientError

        try:
            await s3_client.head_object(
                Bucket=settings.STORAGE_BUCKET_NAME, Key=image.file_path
            )
            raise AssertionError("File should have been deleted")
        except ClientError as e:
            assert e.response["Error"]["Code"] in ("404", "NoSuchKey")

    @pytest.mark.asyncio
    async def test_delete_label_image_renumbers_remaining(
        self,
        async_client: AsyncClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test that deleting image renumbers remaining images."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image1 = LabelImageFactory(label=label, sequence_order=1)
        image2 = LabelImageFactory(label=label, sequence_order=2)
        image3 = LabelImageFactory(label=label, sequence_order=3)
        image4 = LabelImageFactory(label=label, sequence_order=4)
        for img in [image1, image2, image3, image4]:
            await s3_client.put_object(
                Bucket=settings.STORAGE_BUCKET_NAME,
                Key=img.file_path,
                Body=b"test content",
            )
        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        response = await async_client.delete(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{image2.id}",
            headers=headers,
        )
        assert response.status_code == 204
        db.refresh(image1)
        db.refresh(image3)
        db.refresh(image4)
        assert image1.sequence_order == 1
        assert image3.sequence_order == 2
        assert image4.sequence_order == 3

    @pytest.mark.asyncio
    async def test_delete_label_image_last_image(
        self,
        async_client: AsyncClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test deleting the last image leaves label with no images."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(label=label, sequence_order=1)
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=image.file_path,
            Body=b"test content",
        )
        image_id = image.id
        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        response = await async_client.delete(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{image_id}",
            headers=headers,
        )
        assert response.status_code == 204
        assert db.get(LabelImage, image_id) is None
        db.refresh(label)
        assert len(label.images) == 0

    @pytest.mark.asyncio
    async def test_delete_label_image_missing_storage_file(
        self,
        async_client: AsyncClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test that deletion succeeds even if storage file is missing."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(
            label=label,
            file_path="labels/test-uuid/missing.png",
            sequence_order=1,
        )
        image_id = image.id
        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        response = await async_client.delete(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{image_id}",
            headers=headers,
        )
        assert response.status_code == 204
        assert db.get(LabelImage, image_id) is None

    def test_delete_label_image_invalid_image_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test deleting non-existent image."""
        from uuid import uuid4

        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_image_id = uuid4()
        response = client.delete(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{invalid_image_id}",
            headers=headers,
        )
        assert response.status_code == 404

    def test_delete_label_image_wrong_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test deleting image that belongs to different label."""
        user = UserFactory()
        product1 = ProductFactory(created_by=user)
        product2 = ProductFactory(created_by=user)
        label1 = LabelFactory(created_by=user, product=product1)
        label2 = LabelFactory(created_by=user, product=product2)
        image = LabelImageFactory(label=label1)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.delete(
            f"{settings.API_V1_STR}/labels/{label2.id}/images/{image.id}",
            headers=headers,
        )
        assert response.status_code == 404

    def test_delete_label_image_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that deleting label image requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(label=label)
        response = client.delete(
            f"{settings.API_V1_STR}/labels/{label.id}/images/{image.id}"
        )
        assert response.status_code == 401
