"""Product route tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from tests.factories.product import ProductFactory
from tests.factories.product_type import ProductTypeFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


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
