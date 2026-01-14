import factory

from app.db.models.label_data import LabelData
from tests.factories import BaseFactory


class LabelDataFactory(BaseFactory):
    class Meta:
        model = LabelData

    label = factory.SubFactory("tests.factories.label.LabelFactory")
    label_id = factory.LazyAttribute(lambda obj: obj.label.id)
    brand_name_en_extracted = factory.Faker("company")
    brand_name_en_verified = factory.LazyAttribute(
        lambda obj: obj.brand_name_en_extracted
    )
    registration_number_extracted = factory.Sequence(lambda n: f"REG-{n:06d}")
    registration_number_verified = factory.LazyAttribute(
        lambda obj: obj.registration_number_extracted
    )
