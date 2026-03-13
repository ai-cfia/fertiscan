import factory
from pydantic import SecretStr

from app.core.security import get_password_hash
from app.db.models.user import User
from tests.factories import BaseFactory


class UserFactory(BaseFactory):
    class Meta:
        model = User

    email = factory.Faker("email")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    is_active = True
    is_superuser = False
    hashed_password = factory.LazyAttribute(
        lambda _: get_password_hash(SecretStr("testpass123"))
    )
    external_id = None

    class Params:
        superuser = factory.Trait(is_superuser=True)
        inactive = factory.Trait(is_active=False)
