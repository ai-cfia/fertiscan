"""Test cascade delete behavior and relationships for database models."""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.fertilizer_label_data import FertilizerLabelData
from app.db.models.label import Label
from app.db.models.label_data import LabelData
from app.db.models.label_image import LabelImage
from app.db.models.product import Product
from tests.factories.fertilizer_label_data import FertilizerLabelDataFactory
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory


class TestProductLabelCascadeDelete:
    """Tests for cascade delete behavior when deleting a Product."""

    def test_deletes_associated_labels(self, db: Session) -> None:
        """Test that deleting a Product with cascade_delete=True deletes associated Labels."""
        product = ProductFactory()
        label1 = LabelFactory(product=product)
        label2 = LabelFactory(product=product)

        label1_id = label1.id
        label2_id = label2.id

        db.delete(product)
        db.flush()

        assert db.get(Product, product.id) is None
        assert db.get(Label, label1_id) is None
        assert db.get(Label, label2_id) is None

    def test_preserves_labels_when_unlinked(self, db: Session) -> None:
        """Test that unlinking Labels before deleting Product preserves Labels."""
        product = ProductFactory()
        label1 = LabelFactory(product=product)
        label2 = LabelFactory(product=product)

        label1_id = label1.id
        label2_id = label2.id

        label1.product_id = None
        label2.product_id = None
        db.flush()

        db.delete(product)
        db.flush()

        assert db.get(Product, product.id) is None
        label1_refreshed = db.get(Label, label1_id)
        label2_refreshed = db.get(Label, label2_id)
        assert label1_refreshed is not None
        assert label2_refreshed is not None
        assert label1_refreshed.product_id is None
        assert label2_refreshed.product_id is None


class TestLabelLabelImageCascadeDelete:
    """Tests for cascade delete behavior when deleting a Label."""

    def test_deletes_associated_images(self, db: Session) -> None:
        """Test that deleting a Label with cascade_delete=True deletes associated LabelImages."""
        label = LabelFactory()
        image1 = LabelImageFactory(label=label, sequence_order=1)
        image2 = LabelImageFactory(label=label, sequence_order=2)

        image1_id = image1.id
        image2_id = image2.id

        db.delete(label)
        db.flush()

        assert db.get(Label, label.id) is None
        assert db.get(LabelImage, image1_id) is None
        assert db.get(LabelImage, image2_id) is None

    def test_deletes_associated_label_data(self, db: Session) -> None:
        """Test that deleting a Label with cascade_delete=True deletes associated LabelData."""
        label = LabelFactory()
        label_data = LabelDataFactory(label=label)

        label_data_id = label_data.id

        db.delete(label)
        db.flush()

        assert db.get(Label, label.id) is None
        assert db.get(LabelData, label_data_id) is None

    def test_deletes_associated_fertilizer_label_data(self, db: Session) -> None:
        """Test that deleting a Label with cascade_delete=True deletes associated FertilizerLabelData."""
        label = LabelFactory()
        fertilizer_data = FertilizerLabelDataFactory(label=label)

        fertilizer_data_id = fertilizer_data.id

        db.delete(label)
        db.flush()

        assert db.get(Label, label.id) is None
        assert db.get(FertilizerLabelData, fertilizer_data_id) is None

    def test_deletes_all_associated_data(self, db: Session) -> None:
        """Test that deleting a Label deletes all associated data (images, label_data, fertilizer_label_data)."""
        label = LabelFactory()
        image1 = LabelImageFactory(label=label, sequence_order=1)
        label_data = LabelDataFactory(label=label)
        fertilizer_data = FertilizerLabelDataFactory(label=label)

        image1_id = image1.id
        label_data_id = label_data.id
        fertilizer_data_id = fertilizer_data.id

        db.delete(label)
        db.flush()

        assert db.get(Label, label.id) is None
        assert db.get(LabelImage, image1_id) is None
        assert db.get(LabelData, label_data_id) is None
        assert db.get(FertilizerLabelData, fertilizer_data_id) is None


class TestLabelDataRelationships:
    """Tests for LabelData relationships and constraints."""

    def test_unique_label_id_constraint(self, db: Session) -> None:
        """Test that label_id must be unique in LabelData."""
        label = LabelFactory()
        LabelDataFactory(label=label)
        db.flush()
        with pytest.raises(IntegrityError):
            LabelDataFactory(label=label)
            db.flush()

    def test_label_data_relationship(self, db: Session) -> None:
        """Test Label-LabelData relationship works."""
        label = LabelFactory()
        label_data = LabelDataFactory(label=label)
        db.refresh(label)
        assert label.label_data is not None
        assert label.label_data.id == label_data.id
        assert label_data.label.id == label.id

    def test_jsonb_contacts_field(self, db: Session) -> None:
        """Test JSONB contacts field can store and retrieve data."""
        contacts = [
            {
                "type": "manufacturer",
                "name": "Test Co.",
                "address": "123 Main St",
                "phone": "1-800-123-4567",
            }
        ]
        label_data = LabelDataFactory(contacts=contacts)
        assert label_data.contacts == contacts
        assert label_data.contacts[0]["type"] == "manufacturer"


class TestFertilizerLabelDataRelationships:
    """Tests for FertilizerLabelData relationships and constraints."""

    def test_unique_label_id_constraint(self, db: Session) -> None:
        """Test that label_id must be unique in FertilizerLabelData."""
        label = LabelFactory()
        FertilizerLabelDataFactory(label=label)
        db.flush()
        with pytest.raises(IntegrityError):
            FertilizerLabelDataFactory(label=label)
            db.flush()

    def test_label_fertilizer_label_data_relationship(self, db: Session) -> None:
        """Test Label-FertilizerLabelData relationship works."""
        label = LabelFactory()
        fertilizer_data = FertilizerLabelDataFactory(label=label)
        db.refresh(label)
        assert label.fertilizer_label_data is not None
        assert label.fertilizer_label_data.id == fertilizer_data.id
        assert fertilizer_data.label.id == label.id

    def test_decimal_npk_fields(self, db: Session) -> None:
        """Test Decimal NPK fields can store and retrieve values."""
        from decimal import Decimal

        fertilizer_data = FertilizerLabelDataFactory(
            n=Decimal("10.5"),
            p=Decimal("20.75"),
            k=Decimal("5.25"),
        )
        assert fertilizer_data.n == Decimal("10.5")
        assert fertilizer_data.p == Decimal("20.75")
        assert fertilizer_data.k == Decimal("5.25")

    def test_jsonb_ingredients_field(self, db: Session) -> None:
        """Test JSONB ingredients field can store and retrieve data."""
        ingredients = [
            {
                "name_en": "Urea",
                "name_fr": "Urée",
                "value": 46.0,
                "unit": "%",
            }
        ]
        fertilizer_data = FertilizerLabelDataFactory(ingredients=ingredients)
        assert fertilizer_data.ingredients == ingredients
        assert fertilizer_data.ingredients[0]["name_en"] == "Urea"

    def test_jsonb_guaranteed_analysis_field(self, db: Session) -> None:
        """Test JSONB guaranteed_analysis field can store and retrieve data."""
        analysis = {
            "title_en": "Minimum Guaranteed Analysis",
            "title_fr": "Analyse Garantie Minimale",
            "is_minimum": True,
            "nutrients": [
                {
                    "name_en": "Total Nitrogen (N)",
                    "name_fr": "Azote Total (N)",
                    "value": 10.0,
                    "unit": "%",
                }
            ],
        }
        fertilizer_data = FertilizerLabelDataFactory(guaranteed_analysis=analysis)
        assert fertilizer_data.guaranteed_analysis == analysis
        assert (
            fertilizer_data.guaranteed_analysis["title_en"]
            == "Minimum Guaranteed Analysis"
        )
