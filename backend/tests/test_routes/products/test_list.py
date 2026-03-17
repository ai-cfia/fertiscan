"""Tests for listing products with various filters."""

from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.config import settings
from tests.factories.product import ProductFactory
from tests.factories.product_type import ProductTypeFactory


@pytest.mark.usefixtures("override_dependencies")
class TestProductList:
    """Tests for listing products endpoint."""

    PROD_URL = f"{settings.API_V1_STR}/products"

    def test_list_products_empty(self, client: TestClient, auth_headers: dict) -> None:
        """Test listing products when none exist."""
        response = client.get(self.PROD_URL, headers=auth_headers)
        assert response.status_code == 200
        content = response.json()
        assert content["items"] == []
        assert content["total"] == 0
        assert content["limit"] == 50
        assert content["offset"] == 0

    def test_list_products_basic_pagination(
        self, client: TestClient, db: Session, user, auth_headers: dict
    ) -> None:
        """Test listing products with default and custom pagination."""
        ProductFactory.create_batch(150, created_by=user)

        # Default pagination
        response = client.get(self.PROD_URL, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()["items"]) == 50
        assert response.json()["total"] == 150

        # Custom limit
        response = client.get(f"{self.PROD_URL}?limit=10", headers=auth_headers)
        assert len(response.json()["items"]) == 10

        # Offset
        response = client.get(f"{self.PROD_URL}?limit=2&offset=2", headers=auth_headers)
        returned_ids = [item["id"] for item in response.json()["items"]]
        # Note: factory-created batch order might depend on how they are queried.
        # But we check total and limit.
        assert response.json()["total"] == 150
        assert len(returned_ids) == 2

    def test_list_products_product_type_filtering(
        self, client: TestClient, user, auth_headers: dict
    ) -> None:
        """Test filtering by product type (active/inactive)."""
        active_type = ProductTypeFactory(code="fertilizer", is_active=True)
        inactive_type = ProductTypeFactory(code="seed", is_active=False)

        ProductFactory.create_batch(2, created_by=user, product_type=active_type)
        ProductFactory.create_batch(3, created_by=user, product_type=inactive_type)

        # Active filter
        response = client.get(
            f"{self.PROD_URL}?product_type=fertilizer", headers=auth_headers
        )
        assert response.json()["total"] == 2

        # Default excludes inactive
        response = client.get(self.PROD_URL, headers=auth_headers)
        assert response.json()["total"] == 2

        # Inactive filter returns error
        response = client.get(
            f"{self.PROD_URL}?product_type=seed", headers=auth_headers
        )
        assert response.status_code == 400

    def test_list_products_registration_filters(
        self, client: TestClient, user, auth_headers: dict
    ) -> None:
        """Test registration number filtering (exact, partial, no match, invalid)."""
        ProductFactory(registration_number="1234567F", created_by=user)
        ProductFactory(registration_number="1234567G", created_by=user)

        # Exact match
        response = client.get(
            f"{self.PROD_URL}?registration_number=1234567F", headers=auth_headers
        )
        assert response.json()["total"] == 1
        assert response.json()["items"][0]["registration_number"] == "1234567F"

        # Partial match
        response = client.get(
            f"{self.PROD_URL}?registration_number=1234567", headers=auth_headers
        )
        assert response.json()["total"] == 2

        # No match
        response = client.get(
            f"{self.PROD_URL}?registration_number=7654321M", headers=auth_headers
        )
        assert response.json()["total"] == 0

        # Non-matching free-text filter (list endpoint accepts arbitrary search text)
        response = client.get(
            f"{self.PROD_URL}?registration_number=REG@123", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["total"] == 0

    def test_list_products_name_filters(
        self, client: TestClient, user, auth_headers: dict
    ) -> None:
        """Test filtering by brand name and product name."""
        ProductFactory(
            brand_name_en="Alpha Brand",
            name_en="Super Fert",
            created_by=user,
        )
        ProductFactory(
            brand_name_en="Beta Brand",
            name_en="Mega Fert",
            created_by=user,
        )

        # Brand name filter
        response = client.get(
            f"{self.PROD_URL}?brand_name_en=Alpha", headers=auth_headers
        )
        assert response.json()["total"] == 1
        assert response.json()["items"][0]["brand_name_en"] == "Alpha Brand"

        # Product name filter
        response = client.get(f"{self.PROD_URL}?name_en=Super", headers=auth_headers)
        assert response.json()["total"] == 1
        assert response.json()["items"][0]["name_en"] == "Super Fert"

        # No match
        response = client.get(
            f"{self.PROD_URL}?brand_name_en=NonExistent", headers=auth_headers
        )
        assert response.json()["total"] == 0

    def test_list_products_date_filtering(
        self, client: TestClient, user, auth_headers: dict
    ) -> None:
        """Test filtering by created_at and updated_at dates."""
        p1 = ProductFactory(
            created_by=user,
            created_at=datetime(2022, 1, 1),
            updated_at=datetime(2022, 2, 1),
        )

        # Created at filter
        response = client.get(
            f"{self.PROD_URL}?start_created_at=2022-01-01T00:00:00&end_created_at=2022-01-01T23:59:59",
            headers=auth_headers,
        )
        assert response.json()["total"] == 1
        assert response.json()["items"][0]["id"] == str(p1.id)

        # Updated at filter
        response = client.get(
            f"{self.PROD_URL}?start_updated_at=2022-02-01T00:00:00&end_updated_at=2022-02-01T23:59:59",
            headers=auth_headers,
        )
        assert response.json()["total"] == 1

        # Only start date
        response = client.get(
            f"{self.PROD_URL}?start_created_at=2021-12-31T23:59:59",
            headers=auth_headers,
        )
        assert response.json()["total"] == 1

        # Invalid date format
        response = client.get(
            f"{self.PROD_URL}?start_created_at=invalid-date", headers=auth_headers
        )
        assert response.status_code == 422

        # Error date range (start > end)
        response = client.get(
            f"{self.PROD_URL}?start_created_at=2023-01-01T00:00:00&end_created_at=2022-01-01T00:00:00",
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_list_products_complex_filters(
        self, client: TestClient, user, auth_headers: dict
    ) -> None:
        """Test combining multiple filters and SQL injection mitigation."""
        ProductFactory(
            registration_number="7654321M",
            brand_name_en="Complex Brand",
            name_en="Complex Prod",
            created_by=user,
            updated_at=datetime(2023, 1, 1),
        )

        # Combined filters
        response = client.get(
            f"{self.PROD_URL}?brand_name_en=Complex&name_en=Complex&start_updated_at=2023-01-01T00:00:00",
            headers=auth_headers,
        )
        assert response.json()["total"] == 1

        # SQL injection check
        malicious_input = "Safe'; DROP TABLE products; --"
        response = client.get(
            f"{self.PROD_URL}?brand_name_en={malicious_input}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["total"] == 0

    def test_list_products_security(self, client: TestClient) -> None:
        """Test that listing products requires authentication."""
        response = client.get(self.PROD_URL)
        assert response.status_code == 401

    def test_list_products_sort_by_registration(
        self, client: TestClient, user, auth_headers: dict
    ) -> None:
        """Test sorting products by registration number."""
        ProductFactory(registration_number="1234567F", created_by=user)
        ProductFactory(registration_number="1234567G", created_by=user)

        # ASC
        response = client.get(
            f"{self.PROD_URL}?order_by=registration_number&order=asc",
            headers=auth_headers,
        )
        assert response.status_code == 200
        items = response.json()["items"]
        assert [i["registration_number"] for i in items] == ["1234567F", "1234567G"]

        # DESC
        response = client.get(
            f"{self.PROD_URL}?order_by=registration_number&order=desc",
            headers=auth_headers,
        )
        assert response.status_code == 200
        items = response.json()["items"]
        assert [i["registration_number"] for i in items] == ["1234567G", "1234567F"]

    def test_list_products_sort_by_brand(
        self, client: TestClient, user, auth_headers: dict
    ) -> None:
        """Test sorting products by brand name."""
        ProductFactory(brand_name_en="Alpha", created_by=user)
        ProductFactory(brand_name_en="Beta", created_by=user)

        # ASC
        response = client.get(
            f"{self.PROD_URL}?order_by=brand_name_en&order=asc", headers=auth_headers
        )
        items = response.json()["items"]
        assert [i["brand_name_en"] for i in items] == ["Alpha", "Beta"]

        # DESC
        response = client.get(
            f"{self.PROD_URL}?order_by=brand_name_en&order=desc", headers=auth_headers
        )
        items = response.json()["items"]
        assert [i["brand_name_en"] for i in items] == ["Beta", "Alpha"]

    def test_list_products_sort_by_name(
        self, client: TestClient, user, auth_headers: dict
    ) -> None:
        """Test sorting products by product name."""
        ProductFactory(name_en="Apple", created_by=user)
        ProductFactory(name_en="Banana", created_by=user)

        # ASC
        response = client.get(
            f"{self.PROD_URL}?order_by=name_en&order=asc", headers=auth_headers
        )
        items = response.json()["items"]
        assert [i["name_en"] for i in items] == ["Apple", "Banana"]

        # DESC
        response = client.get(
            f"{self.PROD_URL}?order_by=name_en&order=desc", headers=auth_headers
        )
        items = response.json()["items"]
        assert [i["name_en"] for i in items] == ["Banana", "Apple"]
