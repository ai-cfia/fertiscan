"""Tests for listing labels endpoint."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models.label import ReviewStatus
from app.db.models.product import Product
from app.db.models.user import User
from tests.factories.label import LabelFactory
from tests.factories.product import ProductFactory
from tests.factories.product_type import ProductTypeFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestListLabels:
    """Tests for listing labels endpoint."""

    @staticmethod
    def _create_user_and_product() -> tuple[User, Product]:
        """Helper to create user and product for reuse across tests."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        return user, product

    def test_list_labels_empty(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing labels when none exist."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["items"] == []
        assert content["total"] == 0
        assert content["limit"] == 50
        assert content["offset"] == 0

    def test_list_labels_basic(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test listing labels with default pagination."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        LabelFactory.create_batch(150, created_by=user, product=product)
        response = client.get(
            f"{settings.API_V1_STR}/labels",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 50
        assert content["total"] == 150
        assert content["limit"] == 50
        assert content["offset"] == 0
        assert all("id" in item for item in content["items"])

    def test_list_labels_pagination_limit(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test pagination with custom limit."""
        user, product = self._create_user_and_product()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        LabelFactory.create_batch(5, created_by=user, product=product)
        response = client.get(
            f"{settings.API_V1_STR}/labels?limit=2",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 5
        assert content["limit"] == 2
        assert content["offset"] == 0

    def test_list_labels_pagination_offset(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test pagination with offset."""
        user, product = self._create_user_and_product()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        labels = LabelFactory.create_batch(5, created_by=user, product=product)
        sorted_labels = sorted(labels, key=lambda label: label.created_at, reverse=True)
        label_ids = [str(label.id) for label in sorted_labels]
        response = client.get(
            f"{settings.API_V1_STR}/labels?limit=2&offset=2",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 5
        assert content["limit"] == 2
        assert content["offset"] == 2
        returned_ids = [item["id"] for item in content["items"]]
        assert returned_ids == label_ids[2:4]

    def test_list_labels_filter_review_status(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering by review status."""
        user, product = self._create_user_and_product()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        LabelFactory.create_batch(
            2,
            created_by=user,
            product=product,
            review_status=ReviewStatus.completed,
        )
        LabelFactory.create_batch(
            3,
            created_by=user,
            product=product,
            review_status=ReviewStatus.not_started,
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels?review_status=completed",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 2

    def test_list_labels_filter_unlinked(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test filtering unlinked labels."""
        user = UserFactory()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        product = ProductFactory(created_by=user)
        LabelFactory.create_batch(2, created_by=user, product=product)
        LabelFactory.create_batch(3, created_by=user, standalone=True)
        response = client.get(
            f"{settings.API_V1_STR}/labels?unlinked=true",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 3
        assert content["total"] == 3

    def test_list_labels_filter_combined(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test combining multiple filters."""
        user, _ = self._create_user_and_product()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        LabelFactory.create_batch(
            2,
            created_by=user,
            review_status=ReviewStatus.completed,
            standalone=True,
        )
        LabelFactory.create_batch(
            3,
            created_by=user,
            review_status=ReviewStatus.not_started,
            standalone=True,
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels?review_status=completed&unlinked=true",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 2

    def test_list_labels_excludes_inactive_product_types(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that labels with inactive product types are excluded."""
        from tests.factories.product_type import ProductTypeFactory

        user = UserFactory()
        active_type = ProductTypeFactory(code="fertilizer", is_active=True)
        inactive_type = ProductTypeFactory(code="seed", is_active=False)
        active_product = ProductFactory(created_by=user, product_type=active_type)
        inactive_product = ProductFactory(created_by=user, product_type=inactive_type)
        LabelFactory.create_batch(
            2, created_by=user, product=active_product, product_type=active_type
        )
        LabelFactory.create_batch(
            3, created_by=user, product=inactive_product, product_type=inactive_type
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 2
        assert content["total"] == 2

    def test_list_labels_inactive_product_type_returns_empty(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that fetching inactive product types returns empty results."""
        user = UserFactory()
        inactive_type = ProductTypeFactory(code="seed", is_active=False)
        inactive_product = ProductFactory(created_by=user, product_type=inactive_type)
        LabelFactory.create_batch(
            3, created_by=user, product=inactive_product, product_type=inactive_type
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels?product_type=seed",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 0
        assert content["total"] == 0

    def test_list_labels_count_only(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test getting count with minimal limit."""
        user, product = self._create_user_and_product()
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        LabelFactory.create_batch(10, created_by=user, product=product)
        response = client.get(
            f"{settings.API_V1_STR}/labels?limit=1",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert len(content["items"]) == 1
        assert content["total"] == 10

    def test_list_labels_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that listing labels requires authentication."""
        response = client.get(f"{settings.API_V1_STR}/labels")
        assert response.status_code == 401
