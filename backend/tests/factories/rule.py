import factory
from app.db.models.rule import Rule

from tests.factories import BaseFactory


class RuleFactory(BaseFactory):
    class Meta:
        model = Rule

    reference_number = factory.Sequence(lambda n: f"FzR: TEST-{n}")
    title_en = factory.Faker("sentence")
    title_fr = factory.Faker("sentence")
    description_en = factory.Faker("sentence")
    description_fr = factory.Faker("sentence")
    ai_verify = False
    evaluator_code = None
