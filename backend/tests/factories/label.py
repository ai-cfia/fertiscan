import factory

from app.db.models.label import ExtractionStatus, Label, VerificationStatus
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
    extraction_status = ExtractionStatus.pending
    verification_status = VerificationStatus.not_started
    extraction_error_message = None

    class Params:
        standalone = factory.Trait(product=None, product_id=None)
        extracted = factory.Trait(extraction_status=ExtractionStatus.completed)
        verified = factory.Trait(verification_status=VerificationStatus.completed)
