import factory

from app.db.models.item import Item
from tests.factories import BaseFactory
from tests.factories.user import UserFactory


class ItemFactory(BaseFactory):
    class Meta:
        model = Item

    title = factory.Faker("sentence", nb_words=3)
    description = factory.Faker("paragraph")
    owner = factory.SubFactory(UserFactory)
    owner_id = factory.LazyAttribute(lambda obj: obj.owner.id)
