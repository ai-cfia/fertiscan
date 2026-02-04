"""Product route tests."""

from datetime import datetime

import pytest
from botocore.exceptions import ClientError
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models.label import Label
from app.db.models.label_image import LabelImage
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.factories.product_type import ProductTypeFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
    authentication_token_from_email_async,
)


@pytest.mark.usefixtures("override_dependencies")
class TestListProducts:
    """Tests for listing products endpoint."""

    def test_list_products_empty(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing products when none exist."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["items"] == []
        assert content["total"] == 0
        assert content["limit"] == 50
        assert content["offset"] == 0

    def test_list_products_basic(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing products with default pagination."""
        user = UserFactory()
        ProductFactory.create_batch(150, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 50
        assert content["total"] == 150
        assert content["limit"] == 50
        assert content["offset"] == 0
        assert all("id" in item for item in content["items"])

    def test_list_products_pagination_limit(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test pagination with custom limit."""
        user = UserFactory()
        ProductFactory.create_batch(5, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?limit=2",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 5
        assert content["limit"] == 2
        assert content["offset"] == 0

    def test_list_products_pagination_offset(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test pagination with offset."""
        user = UserFactory()
        products = ProductFactory.create_batch(5, created_by=user)
        product_ids = [str(product.id) for product in products]
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?limit=2&offset=2",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 5
        assert content["limit"] == 2
        assert content["offset"] == 2
        returned_ids = [item["id"] for item in content["items"]]
        assert returned_ids == product_ids[2:4]

    def test_list_products_filter_product_type(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering by product type."""
        user = UserFactory()
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        seed_type = ProductTypeFactory(code="seed")
        ProductFactory.create_batch(2, created_by=user, product_type=fertilizer_type)
        ProductFactory.create_batch(3, created_by=user, product_type=seed_type)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?product_type=fertilizer",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 2

    def test_list_products_filter_product_type_default(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that default product_type filter works."""
        user = UserFactory()
        ProductFactory.create_batch(3, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["total"] == 3

    def test_list_products_excludes_inactive_product_types(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that products with inactive product types are excluded."""
        user = UserFactory()
        active_type = ProductTypeFactory(code="fertilizer", is_active=True)
        inactive_type = ProductTypeFactory(code="seed", is_active=False)
        ProductFactory.create_batch(2, created_by=user, product_type=active_type)
        ProductFactory.create_batch(3, created_by=user, product_type=inactive_type)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 2

    def test_list_products_inactive_product_type_returns_error(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that fetching inactive product types returns 400 error."""
        user = UserFactory()
        inactive_type = ProductTypeFactory(code="seed", is_active=False)
        ProductFactory.create_batch(3, created_by=user, product_type=inactive_type)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?product_type=seed",
            headers=headers,
        )
        assert response.status_code == 400

    def test_list_products_count_only(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting count with minimal limit."""
        user = UserFactory()
        ProductFactory.create_batch(10, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?limit=1",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 10

    def test_list_products_filter_registration_number(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering by registration number."""
        user = UserFactory()
        product1 = ProductFactory(registration_number="REG-12345", created_by=user)
        ProductFactory(registration_number="REG-67890", created_by=user)
        ProductFactory(registration_number="REG-11111", created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?registration_number=REG-12345",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 1
        assert content["items"][0]["registration_number"] == "REG-12345"
        assert content["items"][0]["id"] == str(product1.id)

    def test_list_products_filter_registration_number_no_match(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering by registration number with no matches."""
        user = UserFactory()
        ProductFactory.create_batch(3, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?registration_number=NONEXISTENT",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 0
        assert content["total"] == 0

    def test_list_products_filter_registration_number_and_product_type(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering by both registration number and product type."""
        user = UserFactory()
        fertilizer_type = ProductTypeFactory(code="fertilizer")
        seed_type = ProductTypeFactory(code="seed")
        product1 = ProductFactory(
            registration_number="REG-12345",
            created_by=user,
            product_type=fertilizer_type,
        )
        ProductFactory(
            registration_number="REG-12346",
            created_by=user,
            product_type=seed_type,
        )
        ProductFactory(
            registration_number="REG-67890",
            created_by=user,
            product_type=fertilizer_type,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?product_type=fertilizer&registration_number=REG-12345",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 1
        assert content["items"][0]["registration_number"] == "REG-12345"
        assert content["items"][0]["id"] == str(product1.id)

    def test_list_products_invalid_registration_number_pattern(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that invalid registration number pattern returns validation error."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?registration_number=REG@123",
            headers=headers,
        )
        assert response.status_code == 422

    def test_list_products_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that listing products requires authentication."""
        response = client.get(f"{settings.API_V1_STR}/products")
        assert response.status_code == 401


@pytest.mark.usefixtures("override_dependencies")
class TestProductCreate:
    """Test for creating products endpoint."""

    def test_create_product_success(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test successful product creation."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {
            "product_type": "fertilizer",
            "registration_number": "REG123456",
            "brand_name_en": "Test Brand EN",
            "brand_name_fr": "Test Brand FR",
            "name_en": "Test Product EN",
            "name_fr": "Test Product FR",
        }
        response = client.post(
            f"{settings.API_V1_STR}/products",
            headers=headers,
            json=data,
        )
        assert response.status_code == 201

        content = response.json()

        assert "id" in content and content["id"]
        assert content["registration_number"] == data["registration_number"]
        assert content["brand_name_en"] == data["brand_name_en"]
        assert content["brand_name_fr"] == data["brand_name_fr"]
        assert content["name_en"] == data["name_en"]
        assert content["name_fr"] == data["name_fr"]

    def test_existing_registration_code(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating a product with an existing registration number."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {
            "product_type": "fertilizer",
            "registration_number": "REG123456",
            "brand_name_en": "Test Brand EN",
            "brand_name_fr": "Test Brand FR",
            "name_en": "Test Product EN",
            "name_fr": "Test Product FR",
        }
        response1 = client.post(
            f"{settings.API_V1_STR}/products",
            headers=headers,
            json=data,
        )
        assert response1.status_code == 201

        response2 = client.post(
            f"{settings.API_V1_STR}/products",
            headers=headers,
            json=data,
        )
        assert response2.status_code == 409

    def test_required_fields_validation(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test required fields validation when creating a product."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response1 = client.post(
            f"{settings.API_V1_STR}/products",
            headers=headers,
            json={
                "registration_number": "REG123456",
                "brand_name_en": "Test Brand EN",
                "brand_name_fr": "Test Brand FR",
                "name_en": "Test Product EN",
                "name_fr": "Test Product FR",
            },
        )
        assert response1.status_code == 422

        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response2 = client.post(
            f"{settings.API_V1_STR}/products",
            headers=headers,
            json={
                "product_type": "fertilizer",
                "brand_name_en": "Test Brand EN",
                "brand_name_fr": "Test Brand FR",
                "name_en": "Test Product EN",
                "name_fr": "Test Product FR",
            },
        )
        assert response2.status_code == 422

    def test_auth_required(self, db: Session, client: TestClient) -> None:
        """Test that authentication is required for creating a product."""
        response = client.post(
            f"{settings.API_V1_STR}/products",
            headers={},
            json={
                "registration_number": "REG123456",
                "brand_name_en": "Test Brand EN",
                "brand_name_fr": "Test Brand FR",
                "name_en": "Test Product EN",
                "name_fr": "Test Product FR",
            },
        )
        assert response.status_code == 401

    def test_invalid_product_type(self, db: Session, client: TestClient):
        """Test creating a product with an invalid product type."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {
            "product_type": "nonexistent_type",
            "registration_number": "REG123456",
            "brand_name_en": "Test Brand EN",
            "brand_name_fr": "Test Brand FR",
            "name_en": "Test Product EN",
            "name_fr": "Test Product FR",
        }
        response = client.post(
            f"{settings.API_V1_STR}/products",
            headers=headers,
            json=data,
        )
        assert response.status_code == 400

    def test_only_with_required_fields(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating products with the same registration number but different product types."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data_fertilizer = {
            "product_type": "fertilizer",
            "registration_number": "REG123456",
        }
        response1 = client.post(
            f"{settings.API_V1_STR}/products",
            headers=headers,
            json=data_fertilizer,
        )
        assert response1.status_code == 201

    def test_empty_registration_number(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating products with the same registration number but different product types."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data_fertilizer = {
            "product_type": "fertilizer",
            "registration_number": "",
            "brand_name_en": "Fertilizer Brand EN",
            "brand_name_fr": "Fertilizer Brand FR",
            "name_en": "Fertilizer Product EN",
            "name_fr": "Fertilizer Product FR",
        }
        response1 = client.post(
            f"{settings.API_V1_STR}/products",
            headers=headers,
            json=data_fertilizer,
        )
        assert response1.status_code == 201


@pytest.mark.usefixtures("override_dependencies")
class TestDeleteProduct:
    """Tests for deleting products endpoint."""

    def test_delete_product_success(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test successful product deletion."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        product_id = str(product.id)
        response = client.delete(
            f"{settings.API_V1_STR}/products/{product_id}",
            headers=headers,
        )
        assert response.status_code == 200

        content = response.json()
        assert content["message"] == "Product deleted successfully"

    def test_product_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test deleting a non-existent product."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        non_existent_product_id = "123e4567-e89b-12d3-a456-426614174000"
        response = client.delete(
            f"{settings.API_V1_STR}/products/{non_existent_product_id}",
            headers=headers,
        )
        assert response.status_code == 404
        content = response.json()
        assert content["detail"] == "Product not found"

    def test_auth_required_for_deletion(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that authentication is required for deleting a product."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        product_id = str(product.id)
        response = client.delete(
            f"{settings.API_V1_STR}/products/{product_id}",
            headers={},
        )
        assert response.status_code == 401

    def test_try_to_delete_after_already_deleted(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test deleting a product that has already been deleted."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        product_id = str(product.id)
        response1 = client.delete(
            f"{settings.API_V1_STR}/products/{product_id}",
            headers=headers,
        )
        assert response1.status_code == 200
        response2 = client.delete(
            f"{settings.API_V1_STR}/products/{product_id}",
            headers=headers,
        )
        assert response2.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_product_delete_all_associated_data(
        self, async_client: AsyncClient, db: Session
    ) -> None:
        """Test that deleting a product also deletes all associated data from database."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(
            label=label,
            registration_number="REG-12345",
            brand_name_en="New Brand",
            product_name_en="New Name",
        )
        image1 = LabelImageFactory(label=label)
        image1_id = image1.id
        image2 = LabelImageFactory(label=label)
        image2_id = image2.id

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        product_id = product.id
        label_id = label.id

        response = await async_client.delete(
            f"{settings.API_V1_STR}/products/{product_id}",
            headers=headers,
        )
        assert response.status_code == 200

        content = response.json()
        assert content["message"] == "Product deleted successfully"
        db.flush()

        stm = select(Label).where(Label.product_id == product_id)
        label = db.scalar(stm)
        assert label is None
        stm = select(LabelImage).where(LabelImage.label_id == label_id)  # type: ignore[assignment]
        label_images = db.scalar(stm)
        assert label_images is None
        assert (db.get(LabelImage, image1_id) and db.get(LabelImage, image2_id)) is None

    @pytest.mark.asyncio
    async def test_delete_product_delete_files_from_storage(
        self, async_client: AsyncClient, db: Session, s3_client
    ) -> None:
        """Test that deleting a product also deletes all associated files from storage."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        image1 = LabelImageFactory(label=label)
        image2 = LabelImageFactory(label=label)

        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=image1.file_path,
            Body=b"test content",
        )
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=image2.file_path,
            Body=b"test content",
        )

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        product_id = product.id

        response = await async_client.delete(
            f"{settings.API_V1_STR}/products/{product_id}",
            headers=headers,
        )
        assert response.status_code == 200

        try:
            await s3_client.head_object(
                Bucket=settings.STORAGE_BUCKET_NAME,
                Key=image1.file_path,
            )
            raise AssertionError("File should have been deleted")
        except ClientError as e:
            assert e.response["Error"]["Code"] in ("404", "NoSuchKey")
        finally:
            try:
                await s3_client.head_object(
                    Bucket=settings.STORAGE_BUCKET_NAME,
                    Key=image2.file_path,
                )
                raise AssertionError("File should have been deleted")
            except ClientError as e:
                assert e.response["Error"]["Code"] in ("404", "NoSuchKey")


@pytest.mark.usefixtures("override_dependencies")
class TestReadByIdProduct:
    """Tests for reading product by ID endpoint."""

    def test_read_product_by_id_success(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test successful reading product by ID."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        product_id = str(product.id)
        response = client.get(
            f"{settings.API_V1_STR}/products/{product_id}",
            headers=headers,
        )
        assert response.status_code == 200

        content = response.json()
        assert content["id"] == product_id
        assert content["registration_number"] == product.registration_number
        assert content["brand_name_en"] == product.brand_name_en
        assert content["brand_name_fr"] == product.brand_name_fr
        assert content["name_en"] == product.name_en
        assert content["name_fr"] == product.name_fr

    def test_product_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading a non-existent product by ID."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        non_existent_product_id = "123e4567-e89b-12d3-a456-426614174000"
        response = client.get(
            f"{settings.API_V1_STR}/products/{non_existent_product_id}",
            headers=headers,
        )
        assert response.status_code == 404
        content = response.json()
        assert content["detail"] == "Product not found"

    def test_auth_required_for_reading_by_id(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that authentication is required for reading product by ID."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        product_id = str(product.id)
        response = client.get(
            f"{settings.API_V1_STR}/products/{product_id}",
            headers={},
        )
        assert response.status_code == 401


@pytest.mark.usefixtures("override_dependencies")
class TestReadProductWithFilter:
    """Tests for reading products with various filters."""

    def test_read_products_filter_by_brand_name(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering products by brand name."""
        user = UserFactory()
        product1 = ProductFactory(
            registration_number="REG-12345",
            brand_name_en="Alpha Brand",
            brand_name_fr="Marque Alpha",
            created_by=user,
        )
        ProductFactory(
            registration_number="REG-67890",
            brand_name_en="Beta Brand",
            brand_name_fr="Marque Beta",
            created_by=user,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?brand_name=Alpha",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 1
        assert content["items"][0]["brand_name_en"] == "Alpha Brand"
        assert content["items"][0]["id"] == str(product1.id)

    def test_read_products_filter_by_product_name(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering products by product name."""
        user = UserFactory()
        product1 = ProductFactory(
            registration_number="REG-12345",
            name_en="Super Fertilizer",
            name_fr="Super Engrais",
            created_by=user,
        )
        ProductFactory(
            registration_number="REG-67890",
            name_en="Mega Fertilizer",
            name_fr="Mega Engrais",
            created_by=user,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?product_name=Super",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 1
        assert content["items"][0]["name_en"] == "Super Fertilizer"
        assert content["items"][0]["id"] == str(product1.id)

    def test_list_products_no_matching_filters(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing products with filters that match no products."""
        user = UserFactory()
        ProductFactory.create_batch(3, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?brand_name=NonExistentBrand",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 0
        assert content["total"] == 0

    def test_matching_two_products(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing products with filters that match two products."""
        user = UserFactory()
        product1 = ProductFactory(
            registration_number="REG-12345",
            name_en="Common Test",
            name_fr="Test Commun",
            brand_name_en="Common Brand",
            brand_name_fr="Marque Commune",
            created_by=user,
        )
        product2 = ProductFactory(
            registration_number="REG-67890",
            name_en="Common Name",
            name_fr="Nom Commun",
            brand_name_en="Common Brand",
            brand_name_fr="Marque Commune",
            created_by=user,
        )
        ProductFactory(
            registration_number="REG-11111",
            brand_name_en="Unique Brand",
            brand_name_fr="Marque Unique",
            created_by=user,
        )
        ProductFactory(
            registration_number="REG-22222",
            brand_name_en="Another Brand",
            brand_name_fr="Une Autre Marque",
            created_by=user,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?brand_name=Common",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 2
        returned_ids = {item["id"] for item in content["items"]}
        expected_ids = {str(product1.id), str(product2.id)}
        products = content["items"]
        assert products[0]["brand_name_en"] == "Common Brand"
        assert products[1]["brand_name_en"] == "Common Brand"
        assert returned_ids == expected_ids

    def test_partial_match_case_insensitive_with_two_products(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing products with case-insensitive partial match that matches two products."""
        user = UserFactory()
        product1 = ProductFactory(
            registration_number="REG-12345",
            name_en="Alpha Test",
            name_fr="Test Alpha",
            brand_name_en="Alpha Brand",
            brand_name_fr="Marque Alpha",
            created_by=user,
        )
        product2 = ProductFactory(
            registration_number="REG-67890",
            name_en="Beta Test",
            name_fr="Test Beta",
            brand_name_en="Beta Brand",
            brand_name_fr="Marque Beta",
            created_by=user,
        )
        ProductFactory(
            registration_number="REG-11111",
            brand_name_en="Gamma Brand",
            brand_name_fr="Marque Gamma",
            created_by=user,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?product_name=test",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 2
        returned_ids = {item["id"] for item in content["items"]}
        expected_ids = {str(product1.id), str(product2.id)}
        assert returned_ids == expected_ids

    def test_if_registration_number_used_he_are_exact(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that registration number filter requires exact match."""
        user = UserFactory()
        ProductFactory(
            registration_number="REG-12345",
            name_en="Alpha Test",
            name_fr="Test Alpha",
            brand_name_en="Alpha Brand",
            brand_name_fr="Marque Alpha",
            created_by=user,
        )
        ProductFactory(
            registration_number="REG-67890",
            name_en="Beta Test",
            name_fr="Test Beta",
            brand_name_en="Beta Brand",
            brand_name_fr="Marque Beta",
            created_by=user,
        )
        ProductFactory(
            registration_number="REG-11111",
            brand_name_en="Gamma Brand",
            brand_name_fr="Marque Gamma",
            created_by=user,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?registration_number=REG",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 0
        assert content["total"] == 0

    def test_if_no_product_exist_with_filter(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that no products are returned when none match the filter."""
        user = UserFactory()
        ProductFactory.create_batch(3, created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?product_name=NonExistentProduct",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 0
        assert content["total"] == 0

    def test_filter_updated_at(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering products by updated_at date."""
        user = UserFactory()
        product1 = ProductFactory(
            registration_number="REG-12345",
            created_by=user,
            updated_at=datetime(2023, 1, 15),
        )
        ProductFactory(
            registration_number="REG-67890",
            created_by=user,
            updated_at=datetime(2023, 2, 20),
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?start_updated_at=2023-01-15T00:00:00&end_updated_at=2023-01-15T23:59:59",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 1
        assert content["items"][0]["id"] == str(product1.id)

    def test_on_ten_product_with_all_filter_except_registration_number(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering among ten products with all filters except registration number."""
        user = UserFactory()
        products = []
        for i in range(10):
            product = ProductFactory(
                registration_number=f"REG-{i:05d}",
                brand_name_en=f"Brand{i}",
                name_en=f"Product{i}",
                created_by=user,
                updated_at=datetime(2023, 3, i + 1),
            )
            products.append(product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?brand_name=Brand1&product_name=Product1&start_updated_at=2023-03-02T00:00:00&end_updated_at=2023-03-02T23:59:59",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 1
        assert content["items"][0]["id"] == str(products[1].id)

    def test_with_all_filter_with_partial_match_except_registration_number(
        self, client: TestClient, db: Session
    ) -> None:
        """Test filtering among ten products with all filters with partial match except registration number."""
        user = UserFactory()
        products = []
        for i in range(10):
            product = ProductFactory(
                registration_number=f"REG-{i:05d}",
                brand_name_en=f"Brand{i}",
                name_en=f"Product{i}",
                created_by=user,
                updated_at=datetime(2023, 4, 1, i, i),
            )
            products.append(product)
        ProductFactory(
            registration_number="REG-12345",
            brand_name_en="OtherBR",
            name_en="OtherCA",
            created_by=user,
            updated_at=datetime(2023, 3, 1, 0, 0),
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?brand_name=Brand&product_name=Product&start_updated_at=2023-04-01T00:00:00&end_updated_at=2023-04-01T23:59:59",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 10
        assert content["total"] == 10

    def test_sql_injection(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that SQL injection attempts are mitigated."""
        user = UserFactory()
        ProductFactory(
            registration_number="REG-12345",
            brand_name_en="Safe Brand",
            name_en="Safe Product",
            created_by=user,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        malicious_input = "Safe'; DROP TABLE products; --"
        response = client.get(
            f"{settings.API_V1_STR}/products?brand_name={malicious_input}",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 0
        assert content["total"] == 0

    def test_registration_number_exact_match(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering by exact registration number."""
        user = UserFactory()
        products = []
        for i in range(10):
            product = ProductFactory(
                registration_number=f"REG-{i:05d}",
                brand_name_en=f"Brand{i}",
                name_en=f"Product{i}",
                created_by=user,
                updated_at=datetime(2023, 4, i + 1),
            )
            products.append(product)
        ProductFactory(
            registration_number="REG-12345",
            brand_name_en="OtherBR",
            name_en="OtherCA",
            created_by=user,
            updated_at=datetime(2023, 4, 1),
        )
        header = authentication_token_from_email(client=client, email=user.email, db=db)
        response = client.get(
            f"{settings.API_V1_STR}/products?registration_number=REG-12345",
            headers=header,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 1
        assert content["items"][0]["registration_number"] == "REG-12345"

    def test_bad_date_error(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that invalid date format returns validation error."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        # Test invalid month
        response = client.get(
            f"{settings.API_V1_STR}/products?start_updated_at=2026-13-01&end_updated_at=2026-13-31",
            headers=headers,
        )
        assert response.status_code == 422

        # Test invalid day
        response = client.get(
            f"{settings.API_V1_STR}/products?start_updated_at=2026-01-32&end_updated_at=2026-01-33",
            headers=headers,
        )
        assert response.status_code == 422

        # Test completely invalid format
        response = client.get(
            f"{settings.API_V1_STR}/products?start_updated_at=2026-01&end_updated_at=2026-01",
            headers=headers,
        )
        assert response.status_code == 422

        response = client.get(
            f"{settings.API_V1_STR}/products?start_created_at=2026-01-01T25:00:00&end_created_at=2026-01-01T25:00:00",
            headers=headers,
        )
        assert response.status_code == 422

        response = client.get(
            f"{settings.API_V1_STR}/products?start_created_at=2026-04-01T0:00:00&end_created_at=2026-03-01T0:00:00",
            headers=headers,
        )
        assert response.status_code == 422

    def test_filter_created_by(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering products by created_by user."""
        user1 = UserFactory(
            first_name="Creator", last_name="One", email="test@test.com"
        )
        user2 = UserFactory(
            first_name="Creator", last_name="Two", email="test2@test.com"
        )
        product1 = ProductFactory(
            registration_number="REG-12345",
            created_by=user1,
        )
        ProductFactory(
            registration_number="REG-67890",
            created_by=user2,
        )
        headers = authentication_token_from_email(
            client=client, email=user1.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?created_by=Creator One",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 1
        assert content["items"][0]["id"] == str(product1.id)

    def test_filter_created_by_no_match(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering products by created_by user with no match."""
        user1 = UserFactory(
            first_name="Creator", last_name="One", email="test@test.com"
        )
        user2 = UserFactory(
            first_name="Creator", last_name="Two", email="test2@test.com"
        )
        ProductFactory(
            registration_number="REG-12345",
            created_by=user1,
        )
        ProductFactory(
            registration_number="REG-67890",
            created_by=user2,
        )
        headers = authentication_token_from_email(
            client=client, email=user1.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/products?created_by=NoName User",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 0
        assert content["total"] == 0

    def test_common_match_created_by(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering products by created_by user with common name."""
        user1 = UserFactory(
            first_name="Common", last_name="User1", email="test1@test.com"
        )
        user2 = UserFactory(
            first_name="Common", last_name="User2", email="test2@test.com"
        )
        user3 = UserFactory(
            first_name="Unique", last_name="User3", email="test3@test.com"
        )
        ProductFactory(
            registration_number="REG-12345",
            created_by=user1,
        )
        ProductFactory(
            registration_number="REG-67890",
            created_by=user2,
        )
        ProductFactory(
            registration_number="REG-11111",
            created_by=user3,
        )
        headers = authentication_token_from_email(
            client=client, email=user1.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/products?created_by=Common",
            headers=headers,
        )

        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 2

    def test_filter_created_at_valid_date(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering products by created_at date."""
        user = UserFactory()
        product1 = ProductFactory(
            registration_number="REG-12345",
            created_by=user,
            created_at=datetime(2022, 5, 10, 15, 32, 50),
        )
        ProductFactory(
            registration_number="REG-67890",
            created_by=user,
            created_at=datetime(2022, 6, 15, 15, 30, 45),
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/products?start_created_at=2022-05-10T15:32:50&end_created_at=2022-05-10T15:32:50",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 1
        assert content["items"][0]["id"] == str(product1.id)

    def test_filter_date_with_second_difference(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering products by created_at and updated_at with second difference."""
        user = UserFactory()
        product1 = ProductFactory(
            registration_number="REG-12345",
            created_by=user,
            created_at=datetime(2022, 7, 20, 10, 15, 30),
            updated_at=datetime(2022, 7, 20, 10, 15, 35),
        )
        ProductFactory(
            registration_number="REG-67890",
            created_by=user,
            created_at=datetime(2022, 7, 20, 10, 15, 36),
            updated_at=datetime(2022, 7, 20, 10, 15, 37),
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response_created = client.get(
            f"{settings.API_V1_STR}/products?start_created_at=2022-07-20T10:15:30&end_created_at=2022-07-20T10:15:35",
            headers=headers,
        )
        assert response_created.status_code == 200
        content_created = response_created.json()
        assert len(content_created["items"]) == 1
        assert content_created["total"] == 1
        assert content_created["items"][0]["id"] == str(product1.id)

        response_updated = client.get(
            f"{settings.API_V1_STR}/products?start_updated_at=2022-07-20T10:15:35&end_updated_at=2022-07-20T10:15:36",
            headers=headers,
        )
        assert response_updated.status_code == 200
        content_updated = response_updated.json()
        assert len(content_updated["items"]) == 1
        assert content_updated["total"] == 1
        assert content_updated["items"][0]["id"] == str(product1.id)
