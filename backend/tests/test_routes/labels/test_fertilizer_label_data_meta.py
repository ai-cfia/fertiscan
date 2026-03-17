"""Tests for fertilizer label data meta endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.config import settings
from app.db.models.fertilizer_label_data_meta import (
    FertilizerLabelDataFieldName,
    FertilizerLabelDataMeta,
)
from tests.factories.fertilizer_label_data import FertilizerLabelDataFactory
from tests.factories.label import LabelFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestReadFertilizerLabelDataMeta:
    """Tests for reading FertilizerLabelDataMeta."""

    def test_read_fertilizer_label_data_meta_basic(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading FertilizerLabelDataMeta with basic fields."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        fertilizer_data = FertilizerLabelDataFactory(label=label)
        meta1 = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.n,
            needs_review=True,
            note="Test note",
            ai_generated=True,
        )
        meta2 = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.p,
            needs_review=False,
        )
        db.add(meta1)
        db.add(meta2)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data/meta",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        field_names = [m["field_name"] for m in data]
        assert "n" in field_names
        assert "p" in field_names

    def test_read_fertilizer_label_data_meta_filter_by_field_name(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading FertilizerLabelDataMeta filtered by field_name."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        fertilizer_data = FertilizerLabelDataFactory(label=label)
        meta1 = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.n,
            needs_review=True,
        )
        meta2 = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.p,
            needs_review=False,
        )
        db.add(meta1)
        db.add(meta2)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data/meta",
            params={"field_name": "n"},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["field_name"] == "n"
        assert data[0]["needs_review"] is True

    def test_read_fertilizer_label_data_meta_filter_by_needs_review(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading FertilizerLabelDataMeta filtered by needs_review."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        fertilizer_data = FertilizerLabelDataFactory(label=label)
        meta1 = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.n,
            needs_review=True,
        )
        meta2 = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.p,
            needs_review=False,
        )
        db.add(meta1)
        db.add(meta2)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data/meta",
            params={"needs_review": True},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["field_name"] == "n"
        assert data[0]["needs_review"] is True

    def test_read_fertilizer_label_data_meta_empty(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading FertilizerLabelDataMeta when none exist returns empty list."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data/meta",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_read_fertilizer_label_data_meta_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that reading FertilizerLabelDataMeta requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(label=label)
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data/meta"
        )
        assert response.status_code == 401


@pytest.mark.usefixtures("override_dependencies")
class TestUpdateFertilizerLabelDataMeta:
    """Tests for updating FertilizerLabelDataMeta."""

    def test_update_fertilizer_label_data_meta_create(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating FertilizerLabelDataMeta via upsert."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        meta_in = {
            "field_name": "n",
            "needs_review": True,
            "note": "Test note",
            "ai_generated": True,
        }
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data/meta",
            json=meta_in,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["field_name"] == "n"
        assert data["needs_review"] is True
        assert data["note"] == "Test note"
        assert data["ai_generated"] is True

    def test_update_fertilizer_label_data_meta_update_existing(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating existing FertilizerLabelDataMeta via upsert."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        fertilizer_data = FertilizerLabelDataFactory(label=label)
        from app.db.models.fertilizer_label_data_meta import FertilizerLabelDataMeta

        meta = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.n,
            needs_review=False,
            note="Original note",
        )
        db.add(meta)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        meta_in = {
            "field_name": "n",
            "needs_review": True,
            "note": "Updated note",
        }
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data/meta",
            json=meta_in,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["field_name"] == "n"
        assert data["needs_review"] is True
        assert data["note"] == "Updated note"

    def test_update_fertilizer_label_data_meta_partial_update(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test partial update of FertilizerLabelDataMeta."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        fertilizer_data = FertilizerLabelDataFactory(label=label)
        from app.db.models.fertilizer_label_data_meta import FertilizerLabelDataMeta

        meta = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.n,
            needs_review=False,
            note="Original note",
            ai_generated=False,
        )
        db.add(meta)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        meta_in = {
            "field_name": "n",
            "needs_review": True,
        }
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data/meta",
            json=meta_in,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["needs_review"] is True
        assert data["note"] == "Original note"
        assert data["ai_generated"] is False

    def test_update_fertilizer_label_data_meta_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that updating FertilizerLabelDataMeta requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(label=label)
        meta_in = {"field_name": "n", "needs_review": True}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data/meta",
            json=meta_in,
        )
        assert response.status_code == 401

    def test_update_fertilizer_label_data_meta_completed_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating FertilizerLabelDataMeta for completed label returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product, completed=True)
        FertilizerLabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        meta_in = {"field_name": "n", "needs_review": True}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data/meta",
            json=meta_in,
            headers=headers,
        )
        assert response.status_code == 400
        assert "completed" in response.json()["detail"].lower()
