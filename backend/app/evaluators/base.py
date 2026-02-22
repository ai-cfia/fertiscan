from __future__ import annotations

from instructor import AsyncInstructor
from sqlmodel import Session

from app.db.models.label import Label
from app.db.models.rule import Rule
from app.schemas.label import ComplianceResult


class RuleEvaluator:
    """Base framework for programmatic rule evaluation."""

    # The registry holds the mapping of internal rule codes to classes
    _registry: dict[str, type[RuleEvaluator]] = {}
    evaluator_code: str | None = None

    def __init__(
        self,
        rule: Rule,
        session: Session | None = None,
        instructor: AsyncInstructor | None = None,
    ):
        if self.evaluator_code and rule.evaluator_code != self.evaluator_code:
            raise ValueError(
                f"Cannot use {self.__class__.__name__} for rule evaluator code '{rule.evaluator_code}' (expected '{self.evaluator_code}')"
            )

        self.rule = rule
        self.session = session
        self.instructor = instructor

    @classmethod
    def register(cls, code: str):
        """Registers a rule class to a stable, internal key."""

        def wrapper(evaluator_class: type[RuleEvaluator]):
            cls._registry[code] = evaluator_class
            evaluator_class.evaluator_code = code
            return evaluator_class

        return wrapper

    @classmethod
    def get_evaluator(
        cls,
        rule: Rule,
        session: Session | None = None,
        instructor: AsyncInstructor | None = None,
    ) -> RuleEvaluator | None:
        """Retrieves and instantiates the evaluator class for a given rule."""
        if not rule.evaluator_code:
            return None

        if not (evaluator_class := cls._registry.get(rule.evaluator_code)):
            return None

        return evaluator_class(rule=rule, session=session, instructor=instructor)

    async def evaluate(self, label: Label) -> ComplianceResult:
        """Core logic to be implemented by child classes."""
        raise NotImplementedError("Subclasses must implement evaluate()")
