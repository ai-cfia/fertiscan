"""Tests for label deletion endpoint."""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models.label import Label
from tests.factories.label import LabelFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
    authentication_token_from_email_async,
)


@pytest.mark.usefixtures("override_dependencies")
class TestDeleteLabel:
    """Tests for label deletion endpoint."""

    def test_delete_label_no_images(
        self,
        client: TestClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test deleting label with no images."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        label_id = label.id
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.delete(
            f"{settings.API_V1_STR}/labels/{label_id}",
            headers=headers,
        )
        assert response.status_code == 204
        assert db.get(Label, label_id) is None

    @pytest.mark.asyncio
    async def test_delete_label_with_images(
        self,
        async_client: AsyncClient,
        db: Session,
        s3_client,
    ) -> None:
        """Test deleting label with images removes files from storage."""
        from botocore.exceptions import ClientError

        from tests.factories.label_image import LabelImageFactory

        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image1 = LabelImageFactory(
            label=label, file_path="labels/test/file1.jpg", sequence_order=1
        )
        image2 = LabelImageFactory(
            label=label, file_path="labels/test/file2.jpg", sequence_order=2
        )
        label_id = label.id
        file_paths = [image1.file_path, image2.file_path]
        for file_path in file_paths:
            await s3_client.put_object(
                Bucket=settings.STORAGE_BUCKET_NAME,
                Key=file_path,
                Body=b"test content",
            )
        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        response = await async_client.delete(
            f"{settings.API_V1_STR}/labels/{label_id}",
            headers=headers,
        )
        assert response.status_code == 204
        assert db.get(Label, label_id) is None
        for file_path in file_paths:
            try:
                await s3_client.head_object(
                    Bucket=settings.STORAGE_BUCKET_NAME, Key=file_path
                )
                raise AssertionError(f"File {file_path} should have been deleted")
            except ClientError as e:
                assert e.response["Error"]["Code"] in ("404", "NoSuchKey")

    def test_delete_label_invalid_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test deleting non-existent label."""
        from uuid import uuid4

        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        invalid_id = uuid4()
        response = client.delete(
            f"{settings.API_V1_STR}/labels/{invalid_id}",
            headers=headers,
        )
        assert response.status_code == 404

    def test_delete_label_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that deleting label requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        response = client.delete(f"{settings.API_V1_STR}/labels/{label.id}")
        assert response.status_code == 401
