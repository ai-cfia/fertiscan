"""Tests for deleting products endpoint."""

import pytest
from botocore.exceptions import ClientError
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import select
from sqlmodel import Session

from app.config import settings
from app.db.models.label import Label
from app.db.models.label_image import LabelImage
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.utils.user import authentication_token_from_email_async


@pytest.mark.usefixtures("override_dependencies")
class TestDeleteProduct:
    """Tests for deleting products endpoint."""

    PROD_URL = f"{settings.API_V1_STR}/products"

    def test_delete_product_success(
        self, client: TestClient, user, auth_headers: dict
    ) -> None:
        """Test successful product deletion and 404 on subsequent attempts."""
        product = ProductFactory(created_by=user)
        product_id = str(product.id)

        # First delete
        response = client.delete(f"{self.PROD_URL}/{product_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Product deleted successfully"

        # Second delete (already deleted)
        response = client.delete(f"{self.PROD_URL}/{product_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_product_not_found_delete(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        """Test deleting a non-existent product."""
        non_existent_id = "123e4567-e89b-12d3-a456-426614174000"
        response = client.delete(
            f"{self.PROD_URL}/{non_existent_id}", headers=auth_headers
        )
        assert response.status_code == 404

    def test_auth_required_for_deletion(self, client: TestClient, user) -> None:
        """Test authentication for deletion."""
        product = ProductFactory(created_by=user)
        response = client.delete(f"{self.PROD_URL}/{product.id}")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_delete_product_data_cleanup(
        self, async_client: AsyncClient, db: Session, user
    ) -> None:
        """Test that deleting a product also deletes all associated database records."""
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        image = LabelImageFactory(label=label)
        image_id = image.id

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        response = await async_client.delete(
            f"{self.PROD_URL}/{product.id}", headers=headers
        )
        assert response.status_code == 200
        db.flush()

        # Verify cleanup
        assert db.scalar(select(Label).where(Label.product_id == product.id)) is None
        assert (
            db.scalar(select(LabelImage).where(LabelImage.label_id == label.id)) is None
        )
        assert db.get(LabelImage, image_id) is None

    @pytest.mark.asyncio
    async def test_delete_product_storage_cleanup(
        self, async_client: AsyncClient, db: Session, user, s3_client
    ) -> None:
        """Test that deleting a product also deletes all associated files from S3 storage."""
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image = LabelImageFactory(label=label)

        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=image.file_path,
            Body=b"test content",
        )

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        response = await async_client.delete(
            f"{self.PROD_URL}/{product.id}", headers=headers
        )
        assert response.status_code == 200

        # Verify file deletion
        with pytest.raises(ClientError) as excinfo:
            await s3_client.head_object(
                Bucket=settings.STORAGE_BUCKET_NAME, Key=image.file_path
            )
        assert excinfo.value.response["Error"]["Code"] in ("404", "NoSuchKey")
