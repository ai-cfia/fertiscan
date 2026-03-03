import factory

from app.db.models.enums import ModifierType
from app.db.models.requirement import (
    Requirement,
    RequirementModifier,
    RequirementProvision,
)
from tests.factories import BaseFactory


class RequirementProvisionFactory(BaseFactory):
    class Meta:
        model = RequirementProvision

    requirement = factory.SubFactory("tests.factories.requirement.RequirementFactory")
    requirement_id = factory.LazyAttribute(lambda obj: obj.requirement.id)
    provision = factory.SubFactory("tests.factories.provision.ProvisionFactory")
    provision_id = factory.LazyAttribute(lambda obj: obj.provision.id)


class RequirementModifierFactory(BaseFactory):
    class Meta:
        model = RequirementModifier

    requirement = factory.SubFactory("tests.factories.requirement.RequirementFactory")
    requirement_id = factory.LazyAttribute(lambda obj: obj.requirement.id)
    provision = factory.SubFactory("tests.factories.provision.ProvisionFactory")
    provision_id = factory.LazyAttribute(lambda obj: obj.provision.id)
    type = ModifierType.EXEMPTION


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
