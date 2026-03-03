import factory

from app.db.models.requirement import Requirement
from tests.factories import BaseFactory


class RequirementFactory(BaseFactory):
    class Meta:
        model = Requirement

    legislation = factory.SubFactory("tests.factories.legislation.LegislationFactory")
    legislation_id = factory.LazyAttribute(lambda obj: obj.legislation.id)
    title_en = factory.Faker("sentence", nb_words=6)
    title_fr = factory.Faker("sentence", nb_words=6)
    description_en = factory.Faker("paragraph")
    description_fr = factory.Faker("paragraph")
    guidance_en = factory.Faker("paragraph")
    guidance_fr = factory.Faker("paragraph")
