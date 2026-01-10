import factory

from app.db.models.label import ExtractionStatus, Label, VerificationStatus
from tests.factories import BaseFactory


class LabelFactory(BaseFactory):
    class Meta:
        model = Label

    product = factory.SubFactory("tests.factories.product.ProductFactory")
    created_by = factory.SubFactory("tests.factories.user.UserFactory")
    product_type = factory.SubFactory("tests.factories.product_type.ProductTypeFactory")
    extraction_status = ExtractionStatus.pending
    verification_status = VerificationStatus.not_started
    extraction_error_message = None

    class Params:
        standalone = factory.Trait(product=None)
        extracted = factory.Trait(extraction_status=ExtractionStatus.completed)
        verified = factory.Trait(verification_status=VerificationStatus.completed)
