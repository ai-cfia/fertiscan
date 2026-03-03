import factory

from app.db.models.provision import Provision
from tests.factories import BaseFactory


class ProvisionFactory(BaseFactory):
    class Meta:
        model = Provision

    legislation = factory.SubFactory("tests.factories.legislation.LegislationFactory")
    legislation_id = factory.LazyAttribute(lambda obj: obj.legislation.id)
    citation = factory.Sequence(lambda n: f"Section {n}")
    text_en = factory.Faker("paragraph")
    text_fr = factory.Faker("paragraph")
    is_global_rule = False
