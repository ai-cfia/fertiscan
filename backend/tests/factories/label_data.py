import factory

from app.db.models.label_data import LabelData
from tests.factories import BaseFactory


class LabelDataFactory(BaseFactory):
    class Meta:
        model = LabelData

    label = factory.SubFactory("tests.factories.label.LabelFactory")
    label_id = factory.LazyAttribute(lambda obj: obj.label.id)
    brand_name = factory.Dict({"en": factory.Faker("company")})
    registration_number = factory.Sequence(lambda n: f"REG-{n:06d}")
    lot_number: str | None = factory.Sequence(lambda n: f"LOT-{n:06d}")
