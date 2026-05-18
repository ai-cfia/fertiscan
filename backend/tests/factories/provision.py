import uuid

import factory

from app.db.models.provision import Provision
from tests.factories import BaseFactory


class ProvisionFactory(BaseFactory):
    class Meta:
        model = Provision

    legislation = factory.SubFactory("tests.factories.legislation.LegislationFactory")
    legislation_id = factory.LazyAttribute(lambda obj: obj.legislation.id)
    section = factory.LazyFunction(lambda: uuid.uuid4().hex)
    subsection = None
    paragraph = None
    text_en = factory.Faker("paragraph")
    text_fr = factory.Faker("paragraph")
    is_general_exemption = False
    is_current = True
