from app.db.models.product_type import ProductType
from tests.factories import BaseFactory


class ProductTypeFactory(BaseFactory):
    class Meta:
        model = ProductType
        sqlalchemy_session_persistence = "flush"
        sqlalchemy_get_or_create = ("code",)

    code = "fertilizer"
    name_en = "Fertilizer"
    name_fr = "Engrais"
    is_active = True
