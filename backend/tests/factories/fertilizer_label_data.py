from decimal import Decimal

import factory

from app.db.models.fertilizer_label_data import FertilizerLabelData
from tests.factories import BaseFactory


class FertilizerLabelDataFactory(BaseFactory):
    class Meta:
        model = FertilizerLabelData

    label = factory.SubFactory("tests.factories.label.LabelFactory")
    label_id = factory.LazyAttribute(lambda obj: obj.label.id)
    n = Decimal("10.0")
    p = Decimal("20.0")
    k = Decimal("10.0")
    ingredients = factory.LazyAttribute(
        lambda o: [
            {
                "name": {"en": "Nitrogen", "fr": "Azote"},
                "value": str(o.n),
                "unit": "%",
            },
            {
                "name": {"en": "Phosphorus", "fr": "Phosphore"},
                "value": str(o.p),
                "unit": "%",
            },
            {
                "name": {"en": "Potassium", "fr": "Potassium"},
                "value": str(o.k),
                "unit": "%",
            },
        ]
    )
    guaranteed_analysis = factory.LazyAttribute(
        lambda o: {
            "title": {"en": "Guaranteed Analysis", "fr": "Analyse Garantie"},
            "is_minimum": True,
            "nutrients": [
                {
                    "name": {"en": "Total Nitrogen (N)", "fr": "Azote Total (N)"},
                    "value": float(o.n),
                    "unit": "%",
                },
                {
                    "name": {
                        "en": "Available Phosphoric Acid (P2O5)",
                        "fr": "Acide Phosphorique Assimilable (P2O5)",
                    },
                    "value": float(o.p),
                    "unit": "%",
                },
                {
                    "name": {
                        "en": "Soluble Potash (K2O)",
                        "fr": "Potasse Soluble (K2O)",
                    },
                    "value": float(o.k),
                    "unit": "%",
                },
            ],
        }
    )
    precaution_statements = [{"en": "Keep out of reach of children."}]
    directions_for_use_statements = [{"en": "Apply monthly during the growing season."}]
