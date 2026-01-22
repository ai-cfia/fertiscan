"""Tests for label data extraction endpoints."""

import pytest
from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models.label_image import UploadStatus
from tests.factories.label import LabelFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.factories.product_type import ProductTypeFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email

# Minimal valid 1x1 PNG image (transparent pixel)
MINIMAL_PNG = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.mark.usefixtures("override_dependencies")
class TestExtractFertilizerFields:
    """Tests for POST /labels/{label_id}/fertilizer-extract endpoint."""

    def test_extract_fertilizer_fields_no_images(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test extraction without completed images returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        label = LabelFactory(
            created_by=user, product=product, product_type=fertilizer_type
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-extract",
            headers=headers,
        )
        assert response.status_code == 400
        assert "no completed images" in response.json()["detail"].lower()

    def test_extract_fertilizer_fields_only_pending_images(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test extraction with only pending images returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        label = LabelFactory(
            created_by=user, product=product, product_type=fertilizer_type
        )
        LabelImageFactory(label=label, status=UploadStatus.pending)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-extract",
            headers=headers,
        )
        assert response.status_code == 400
        assert "no completed images" in response.json()["detail"].lower()

    def test_extract_fertilizer_fields_non_fertilizer_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test extraction on non-fertilizer label returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        non_fertilizer_type = ProductTypeFactory(code="pesticide")
        label = LabelFactory(
            created_by=user, product=product, product_type=non_fertilizer_type
        )
        LabelImageFactory(label=label, status=UploadStatus.completed)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-extract",
            headers=headers,
        )
        assert response.status_code == 400
        assert "not a fertilizer" in response.json()["detail"].lower()

    def test_extract_fertilizer_fields_invalid_label_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test extraction with invalid label ID format returns 422."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/invalid-uuid/fertilizer-extract",
            headers=headers,
        )
        assert response.status_code == 422

    def test_extract_fertilizer_fields_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that extraction requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        label = LabelFactory(
            created_by=user, product=product, product_type=fertilizer_type
        )
        LabelImageFactory(label=label, status=UploadStatus.completed)
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-extract",
        )
        assert response.status_code == 401

    def test_extract_fertilizer_fields_completed_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test extraction for completed label returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        label = LabelFactory(
            created_by=user,
            product=product,
            product_type=fertilizer_type,
            completed=True,
        )
        LabelImageFactory(label=label, status=UploadStatus.completed)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-extract",
            headers=headers,
        )
        assert response.status_code == 400
        assert "completed" in response.json()["detail"].lower()


@pytest.mark.usefixtures("override_dependencies")
class TestExtractFertilizerFieldsWithFieldNames:
    """Tests for POST /labels/{label_id}/fertilizer-extract with field_names parameter."""

    @pytest.mark.asyncio
    async def test_extract_specific_fields(
        self,
        client: TestClient,
        db: Session,
        s3_client: AioBaseClient,
    ) -> None:
        """Test extraction with specific field names."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        label = LabelFactory(
            created_by=user, product=product, product_type=fertilizer_type
        )
        image = LabelImageFactory(label=label, status=UploadStatus.completed)
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=image.file_path,
            Body=MINIMAL_PNG,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-extract",
            headers=headers,
            json={"field_names": ["brand_name_en", "caution_en"]},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_extract_all_fields_empty_body(
        self,
        client: TestClient,
        db: Session,
        s3_client: AioBaseClient,
    ) -> None:
        """Test extraction with empty body extracts all fields."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        label = LabelFactory(
            created_by=user, product=product, product_type=fertilizer_type
        )
        image = LabelImageFactory(label=label, status=UploadStatus.completed)
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=image.file_path,
            Body=MINIMAL_PNG,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-extract",
            headers=headers,
            json={},
        )
        assert response.status_code == 200

    def test_extract_invalid_field_name(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test extraction with invalid field name returns 422."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        label = LabelFactory(
            created_by=user, product=product, product_type=fertilizer_type
        )
        LabelImageFactory(label=label, status=UploadStatus.completed)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-extract",
            headers=headers,
            json={"field_names": ["invalid_field_name"]},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_extract_mixed_field_names(
        self,
        client: TestClient,
        db: Session,
        s3_client: AioBaseClient,
    ) -> None:
        """Test extraction with mixed common and fertilizer field names."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        label = LabelFactory(
            created_by=user, product=product, product_type=fertilizer_type
        )
        image = LabelImageFactory(label=label, status=UploadStatus.completed)
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=image.file_path,
            Body=MINIMAL_PNG,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-extract",
            headers=headers,
            json={
                "field_names": [
                    "brand_name_en",
                    "caution_en",
                    "instructions_en",
                    "n",
                ]
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_extract_safety_fields_semantic_grouping(
        self,
        client: TestClient,
        db: Session,
        s3_client: AioBaseClient,
    ) -> None:
        """Test extraction of all safety information fields together."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        label = LabelFactory(
            created_by=user, product=product, product_type=fertilizer_type
        )
        image = LabelImageFactory(label=label, status=UploadStatus.completed)
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=image.file_path,
            Body=MINIMAL_PNG,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-extract",
            headers=headers,
            json={
                "field_names": [
                    "caution_en",
                    "caution_fr",
                    "instructions_en",
                    "instructions_fr",
                ]
            },
        )
        assert response.status_code == 200
