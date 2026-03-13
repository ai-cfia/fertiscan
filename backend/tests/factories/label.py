import factory

from app.db.models.label import Label, ReviewStatus
from tests.factories import BaseFactory


class LabelFactory(BaseFactory):
    class Meta:
        model = Label

    product = factory.SubFactory("tests.factories.product.ProductFactory")
    created_by = factory.SubFactory("tests.factories.user.UserFactory")
    product_type = factory.SubFactory("tests.factories.product_type.ProductTypeFactory")
    product_id = factory.LazyAttribute(
        lambda obj: obj.product.id if obj.product else None
    )
    created_by_id = factory.LazyAttribute(lambda obj: obj.created_by.id)
    product_type_id = factory.LazyAttribute(lambda obj: obj.product_type.id)
    review_status = ReviewStatus.not_started

    class Params:
        standalone = factory.Trait(product=None, product_id=None)
        in_progress = factory.Trait(review_status=ReviewStatus.in_progress)
        completed = factory.Trait(review_status=ReviewStatus.completed)
