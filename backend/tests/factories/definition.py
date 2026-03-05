import factory

from app.db.models.definition import Definition
from tests.factories import BaseFactory


class DefinitionFactory(BaseFactory):
    class Meta:
        model = Definition

    legislation = factory.SubFactory("tests.factories.legislation.LegislationFactory")
    legislation_id = factory.LazyAttribute(lambda obj: obj.legislation.id)
    title_en = factory.Faker("word")
    title_fr = factory.Faker("word")
    text_en = factory.Faker("sentence")
    text_fr = factory.Faker("sentence")
