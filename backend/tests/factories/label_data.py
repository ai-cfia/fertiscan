import factory

from app.db.models.label_data import LabelData
from tests.factories import BaseFactory


class LabelDataFactory(BaseFactory):
    class Meta:
        model = LabelData

    label = factory.SubFactory("tests.factories.label.LabelFactory")
    label_id = factory.LazyAttribute(lambda obj: obj.label.id)
    brand_name_en = factory.Faker("company")
    registration_number = factory.Sequence(lambda n: f"REG-{n:06d}")
