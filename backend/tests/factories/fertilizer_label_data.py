from decimal import Decimal
from typing import Any

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
    ingredients = list[dict[str, Any]]
    guaranteed_analysis = dict[str, Any]
