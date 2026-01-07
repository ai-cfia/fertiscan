import factory

from app.db.models.label_image import LabelImage
from tests.factories import BaseFactory


class LabelImageFactory(BaseFactory):
    class Meta:
        model = LabelImage

    label = factory.SubFactory("tests.factories.label.LabelFactory")
    file_path = factory.Sequence(lambda n: f"labels/test-label-{n:06d}/image_{n}.jpg")
    sequence_order = factory.Sequence(lambda n: n + 1)
