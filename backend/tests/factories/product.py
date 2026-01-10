import factory

from app.db.models.product import Product
from tests.factories import BaseFactory


class ProductFactory(BaseFactory):
    class Meta:
        model = Product

    registration_number = factory.Sequence(lambda n: f"REG-{n:06d}")
    name_en = factory.Faker("sentence", nb_words=3)
    name_fr = None
    brand_name_en = factory.Faker("company")
    brand_name_fr = None
    created_by = factory.SubFactory("tests.factories.user.UserFactory")
    product_type = factory.SubFactory("tests.factories.product_type.ProductTypeFactory")
