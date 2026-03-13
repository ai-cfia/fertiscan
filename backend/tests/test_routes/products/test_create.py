"""Tests for creating products endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.config import settings


@pytest.mark.usefixtures("override_dependencies")
class TestProductCreate:
    """Test for creating products endpoint."""

    PROD_URL = f"{settings.API_V1_STR}/products"

    def test_create_product_success(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        """Test successful product creation."""
        data = {
            "product_type": "fertilizer",
            "registration_number": "2018161F",
            "brand_name_en": "Test Brand EN",
            "brand_name_fr": "Test Brand FR",
            "name_en": "Test Product EN",
            "name_fr": "Test Product FR",
        }
        response = client.post(self.PROD_URL, headers=auth_headers, json=data)
        assert response.status_code == 201

        content = response.json()
        assert "id" in content and content["id"]
        assert content["registration_number"] == data["registration_number"]
        assert content["brand_name_en"] == data["brand_name_en"]
        assert content["name_en"] == data["name_en"]

    def test_existing_registration_code(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        """Test creating a product with an existing registration number."""
        data = {
            "product_type": "fertilizer",
            "registration_number": "2018161F",
        }
        client.post(self.PROD_URL, headers=auth_headers, json=data)
        response = client.post(self.PROD_URL, headers=auth_headers, json=data)
        assert response.status_code == 409

    def test_required_fields_validation(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        """Test required fields validation (e.g. product_type)."""
        # Missing product_type
        response = client.post(
            self.PROD_URL,
            headers=auth_headers,
            json={"registration_number": "2018161F"},
        )
        assert response.status_code == 422

        # Optional registration_number - should work
        response = client.post(
            self.PROD_URL, headers=auth_headers, json={"product_type": "fertilizer"}
        )
        assert response.status_code == 201

    def test_invalid_product_type(self, client: TestClient, auth_headers: dict):
        """Test creating a product with an invalid product type."""
        data = {
            "product_type": "nonexistent_type",
            "registration_number": "2018161F",
        }
        response = client.post(self.PROD_URL, headers=auth_headers, json=data)
        assert response.status_code == 400

    def test_empty_registration_number(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        """Test creating products with empty registration number string."""
        data = {
            "product_type": "fertilizer",
            "registration_number": "",
        }
        response = client.post(self.PROD_URL, headers=auth_headers, json=data)
        assert response.status_code == 201

    def test_auth_required(self, client: TestClient) -> None:
        """Test that authentication is required."""
        response = client.post(self.PROD_URL, json={"product_type": "fertilizer"})
        assert response.status_code == 401
