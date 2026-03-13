import factory

from app.db.models.legislation import Legislation
from tests.factories import BaseFactory


class LegislationFactory(BaseFactory):
    class Meta:
        model = Legislation

    citation_reference = factory.Sequence(lambda n: f"Fertilizers Act TEST-{n}")
    legislation_type = "regulation"
    source_url_en = factory.Faker("url")
    source_url_fr = factory.Faker("url")
    title_en = factory.Faker("sentence", nb_words=6)
    title_fr = factory.Faker("sentence", nb_words=6)
    description_en = factory.Faker("paragraph")
    description_fr = factory.Faker("paragraph")
    guidance_en = factory.Faker("paragraph")
    guidance_fr = factory.Faker("paragraph")
