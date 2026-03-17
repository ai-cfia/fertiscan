"""Tests for fertilizer label data endpoints."""

from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.config import settings
from app.schemas.label_data import GuaranteedAnalysis, Ingredient
from tests.factories.fertilizer_label_data import FertilizerLabelDataFactory
from tests.factories.label import LabelFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestCreateFertilizerLabelData:
    """Tests for creating FertilizerLabelData."""

    def test_create_fertilizer_label_data_basic(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating FertilizerLabelData with basic fields."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data_in = {
            "n": "10.5",
            "p": "20.0",
            "k": "15.0",
        }
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=data_in,
            headers=headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["n"] == "10.5"
        assert data["p"] == "20"
        assert data["k"] == "15"
        assert "id" not in data

    def test_create_fertilizer_label_data_with_ingredients(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating FertilizerLabelData with ingredients JSON field."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        ingredients_data = [
            {
                "name": {"en": "Urea", "fr": "Urée"},
                "value": "46.0",
                "unit": "%",
            },
            {
                "name": {"en": "Ammonium Phosphate", "fr": "Phosphate d'Ammonium"},
                "value": "20.0",
                "unit": "%",
            },
        ]
        data_in = {
            "n": "10.0",
            "ingredients": ingredients_data,
        }
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=data_in,
            headers=headers,
        )
        assert response.status_code == 201, response.json()
        data = response.json()
        assert data["n"] == "10"
        assert "ingredients" in data
        assert isinstance(data["ingredients"], list)
        assert len(data["ingredients"]) == 2
        assert data["ingredients"][0]["name"]["en"] == "Urea"
        try:
            Ingredient.model_validate(data["ingredients"][0])
            Ingredient.model_validate(data["ingredients"][1])
        except Exception as e:
            pytest.fail(f"Ingredient validation failed: {e}")

    def test_create_fertilizer_label_data_with_guaranteed_analysis(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating FertilizerLabelData with guaranteed_analysis JSON field."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        analysis_data = {
            "title": {
                "en": "Minimum Guaranteed Analysis",
                "fr": "Analyse Garantie Minimale",
            },
            "is_minimum": True,
            "nutrients": [
                {
                    "name": {"en": "Total Nitrogen (N)", "fr": "Azote Total (N)"},
                    "value": "10.0",
                    "unit": "%",
                },
                {
                    "name": {
                        "en": "Available Phosphate (P₂O₅)",
                        "fr": "Phosphate Disponible (P₂O₅)",
                    },
                    "value": "20.0",
                    "unit": "%",
                },
            ],
        }
        data_in = {
            "n": "10.0",
            "guaranteed_analysis": analysis_data,
        }
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=data_in,
            headers=headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["n"] == "10"
        assert "guaranteed_analysis" in data
        assert isinstance(data["guaranteed_analysis"], dict)
        assert (
            data["guaranteed_analysis"]["title"]["en"] == "Minimum Guaranteed Analysis"
        )
        assert data["guaranteed_analysis"]["is_minimum"] is True
        assert len(data["guaranteed_analysis"]["nutrients"]) == 2
        try:
            GuaranteedAnalysis.model_validate(data["guaranteed_analysis"])
        except Exception as e:
            pytest.fail(f"GuaranteedAnalysis validation failed: {e}")

    def test_create_fertilizer_label_data_already_exists(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating FertilizerLabelData when it already exists returns 409."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data_in = {"n": "10.0"}
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=data_in,
            headers=headers,
        )
        assert response.status_code == 409

    def test_create_fertilizer_label_data_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that creating FertilizerLabelData requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        data_in = {"n": "10.0"}
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=data_in,
        )
        assert response.status_code == 401

    def test_create_fertilizer_label_data_completed_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating FertilizerLabelData for completed label returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product, completed=True)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data_in = {"n": "10.0"}
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=data_in,
            headers=headers,
        )
        assert response.status_code == 400
        assert "completed" in response.json()["detail"].lower()


@pytest.mark.usefixtures("override_dependencies")
class TestReadFertilizerLabelData:
    """Tests for reading FertilizerLabelData."""

    def test_read_fertilizer_label_data_basic(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading FertilizerLabelData with basic fields."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(
            label=label,
            n=Decimal("10.5"),
            p=Decimal("20.0"),
            k=Decimal("15.0"),
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["n"] == "10.5"
        assert data["p"] == "20"
        assert data["k"] == "15"
        assert "id" not in data

    def test_read_fertilizer_label_data_with_json_fields(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading FertilizerLabelData with JSON fields."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        ingredients_data = [
            {
                "name": {"en": "Urea", "fr": "Urée"},
                "value": "46.0",
                "unit": "%",
            }
        ]
        FertilizerLabelDataFactory(
            label=label,
            n=Decimal("10.0"),
            ingredients=ingredients_data,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["n"] == "10"
        assert "ingredients" in data
        assert isinstance(data["ingredients"], list)
        assert len(data["ingredients"]) == 1
        assert data["ingredients"][0]["name"]["en"] == "Urea"
        try:
            Ingredient.model_validate(data["ingredients"][0])
        except Exception as e:
            pytest.fail(f"Ingredient validation failed: {e}")

    def test_read_fertilizer_label_data_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading non-existent FertilizerLabelData returns 404."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            headers=headers,
        )
        assert response.status_code == 404

    def test_read_fertilizer_label_data_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that reading FertilizerLabelData requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(label=label)
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data"
        )
        assert response.status_code == 401


@pytest.mark.usefixtures("override_dependencies")
class TestUpdateFertilizerLabelData:
    """Tests for updating FertilizerLabelData."""

    def test_update_fertilizer_label_data_partial(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test partial update of FertilizerLabelData."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(
            label=label,
            n=Decimal("10.0"),
            p=Decimal("20.0"),
            k=Decimal("15.0"),
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"n": "12.0"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["n"] == "12"
        assert data["p"] == "20"
        assert data["k"] == "15"

    def test_update_fertilizer_label_data_with_json_fields(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating FertilizerLabelData JSON fields."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(
            label=label,
            n=Decimal("10.0"),
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        new_ingredients = [
            {
                "name": {"en": "Ammonium Nitrate", "fr": "Nitrate d'Ammonium"},
                "value": "34.0",
                "unit": "%",
            }
        ]
        update_data = {"ingredients": new_ingredients}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["n"] == "10"
        assert "ingredients" in data
        assert isinstance(data["ingredients"], list)
        assert len(data["ingredients"]) == 1
        assert data["ingredients"][0]["name"]["en"] == "Ammonium Nitrate"
        try:
            Ingredient.model_validate(data["ingredients"][0])
        except Exception as e:
            pytest.fail(f"Ingredient validation failed: {e}")

    def test_update_fertilizer_label_data_empty_update(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating FertilizerLabelData with empty update data returns original."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(
            label=label,
            n=Decimal("10.0"),
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json={},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["n"] == "10"

    def test_update_fertilizer_label_data_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating non-existent FertilizerLabelData returns 404."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"n": "12.0"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 404

    def test_update_fertilizer_label_data_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that updating FertilizerLabelData requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        FertilizerLabelDataFactory(label=label)
        update_data = {"n": "12.0"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=update_data,
        )
        assert response.status_code == 401

    def test_update_fertilizer_label_data_completed_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating FertilizerLabelData for completed label returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product, completed=True)
        FertilizerLabelDataFactory(
            label=label,
            n=Decimal("10.0"),
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"n": "12.0"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/fertilizer-data",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 400
        assert "completed" in response.json()["detail"].lower()
