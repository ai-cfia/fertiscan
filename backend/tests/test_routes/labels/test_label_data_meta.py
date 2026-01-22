"""Tests for label data meta endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models.label_data_field_meta import (
    LabelDataFieldMeta,
    LabelDataFieldName,
)
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestReadLabelDataMeta:
    """Tests for reading LabelDataMeta."""

    def test_read_label_data_meta_basic(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading LabelDataMeta with basic fields."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        label_data = LabelDataFactory(label=label)
        meta1 = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.brand_name_en,
            needs_review=True,
            note="Test note",
            ai_generated=True,
        )
        meta2 = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.product_name_en,
            needs_review=False,
        )
        db.add(meta1)
        db.add(meta2)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/data/meta",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        field_names = [m["field_name"] for m in data]
        assert "brand_name_en" in field_names
        assert "product_name_en" in field_names

    def test_read_label_data_meta_filter_by_field_name(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading LabelDataMeta filtered by field_name."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        label_data = LabelDataFactory(label=label)
        meta1 = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.brand_name_en,
            needs_review=True,
        )
        meta2 = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.product_name_en,
            needs_review=False,
        )
        db.add(meta1)
        db.add(meta2)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/data/meta",
            params={"field_name": "brand_name_en"},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["field_name"] == "brand_name_en"
        assert data[0]["needs_review"] is True

    def test_read_label_data_meta_filter_by_needs_review(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading LabelDataMeta filtered by needs_review."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        label_data = LabelDataFactory(label=label)
        meta1 = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.brand_name_en,
            needs_review=True,
        )
        meta2 = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.product_name_en,
            needs_review=False,
        )
        db.add(meta1)
        db.add(meta2)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/data/meta",
            params={"needs_review": True},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["field_name"] == "brand_name_en"
        assert data[0]["needs_review"] is True

    def test_read_label_data_meta_empty(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading LabelDataMeta when none exist returns empty list."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/data/meta",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_read_label_data_meta_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that reading LabelDataMeta requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        response = client.get(f"{settings.API_V1_STR}/labels/{label.id}/data/meta")
        assert response.status_code == 401


@pytest.mark.usefixtures("override_dependencies")
class TestUpdateLabelDataMeta:
    """Tests for updating LabelDataMeta."""

    def test_update_label_data_meta_create(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating LabelDataMeta via upsert."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        meta_in = {
            "field_name": "brand_name_en",
            "needs_review": True,
            "note": "Test note",
            "ai_generated": True,
        }
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data/meta",
            json=meta_in,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["field_name"] == "brand_name_en"
        assert data["needs_review"] is True
        assert data["note"] == "Test note"
        assert data["ai_generated"] is True

    def test_update_label_data_meta_update_existing(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating existing LabelDataMeta via upsert."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        label_data = LabelDataFactory(label=label)
        from app.db.models.label_data_field_meta import LabelDataFieldMeta

        meta = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.brand_name_en,
            needs_review=False,
            note="Original note",
        )
        db.add(meta)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        meta_in = {
            "field_name": "brand_name_en",
            "needs_review": True,
            "note": "Updated note",
        }
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data/meta",
            json=meta_in,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["field_name"] == "brand_name_en"
        assert data["needs_review"] is True
        assert data["note"] == "Updated note"

    def test_update_label_data_meta_partial_update(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test partial update of LabelDataMeta."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        label_data = LabelDataFactory(label=label)
        from app.db.models.label_data_field_meta import LabelDataFieldMeta

        meta = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.brand_name_en,
            needs_review=False,
            note="Original note",
            ai_generated=False,
        )
        db.add(meta)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        meta_in = {
            "field_name": "brand_name_en",
            "needs_review": True,
        }
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data/meta",
            json=meta_in,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["needs_review"] is True
        assert data["note"] == "Original note"
        assert data["ai_generated"] is False

    def test_update_label_data_meta_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that updating LabelDataMeta requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        meta_in = {"field_name": "brand_name_en", "needs_review": True}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data/meta",
            json=meta_in,
        )
        assert response.status_code == 401

    def test_update_label_data_meta_completed_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating LabelDataMeta for completed label returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product, completed=True)
        LabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        meta_in = {"field_name": "brand_name_en", "needs_review": True}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data/meta",
            json=meta_in,
            headers=headers,
        )
        assert response.status_code == 400
        assert "completed" in response.json()["detail"].lower()
