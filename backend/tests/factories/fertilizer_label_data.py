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
            {"name_en": "Nitrogen", "name_fr": "Azote", "value": str(o.n), "unit": "%"},
            {
                "name_en": "Phosphorus",
                "name_fr": "Phosphore",
                "value": str(o.p),
                "unit": "%",
            },
            {
                "name_en": "Potassium",
                "name_fr": "Potassium",
                "value": str(o.k),
                "unit": "%",
            },
        ]
    )
    guaranteed_analysis = factory.LazyAttribute(
        lambda o: {
            "title_en": "Guaranteed Analysis",
            "title_fr": "Analyse Garantie",
            "is_minimum": True,
            "nutrients": [
                {
                    "name_en": "Total Nitrogen (N)",
                    "name_fr": "Azote Total (N)",
                    "value": float(o.n),
                    "unit": "%",
                },
                {
                    "name_en": "Available Phosphoric Acid (P2O5)",
                    "name_fr": "Acide Phosphorique Assimilable (P2O5)",
                    "value": float(o.p),
                    "unit": "%",
                },
                {
                    "name_en": "Soluble Potash (K2O)",
                    "name_fr": "Potasse Soluble (K2O)",
                    "value": float(o.k),
                    "unit": "%",
                },
            ],
        }
    )
    caution_en = "Keep out of reach of children."
    caution_fr = "Garder hors de la portée des enfants."
    instructions_en = "Apply monthly during the growing season."
    instructions_fr = "Appliquer mensuellement pendant la saison de croissance."
