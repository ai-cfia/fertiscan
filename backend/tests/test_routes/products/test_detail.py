"""Tests for reading product by ID endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from tests.factories.product import ProductFactory


@pytest.mark.usefixtures("override_dependencies")
class TestReadByIdProduct:
    """Tests for reading product by ID endpoint."""

    PROD_URL = f"{settings.API_V1_STR}/products"

    def test_read_product_by_id_success(
        self, client: TestClient, user, auth_headers: dict
    ) -> None:
        """Test successful reading product by ID."""
        product = ProductFactory(created_by=user)
        product_id = str(product.id)
        response = client.get(f"{self.PROD_URL}/{product_id}", headers=auth_headers)
        assert response.status_code == 200

        content = response.json()
        assert content["id"] == product_id
        assert content["registration_number"] == product.registration_number

    def test_product_not_found(self, client: TestClient, auth_headers: dict) -> None:
        """Test reading a non-existent product."""
        non_existent_id = "123e4567-e89b-12d3-a456-426614174000"
        response = client.get(
            f"{self.PROD_URL}/{non_existent_id}", headers=auth_headers
        )
        assert response.status_code == 404

    def test_auth_required_for_reading_by_id(self, client: TestClient, user) -> None:
        """Test that authentication is required."""
        product = ProductFactory(created_by=user)
        response = client.get(f"{self.PROD_URL}/{product.id}")
        assert response.status_code == 401
