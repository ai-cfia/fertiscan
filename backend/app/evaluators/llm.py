from pydantic import validate_call

from app.config import settings
from app.db.models.label import Label
from app.evaluators.base import RuleEvaluator
from app.schemas.label import ComplianceResult, LabelEvaluationContext


@RuleEvaluator.register("LLM_EVALUATION")
class LLMEvaluator(RuleEvaluator):
    @validate_call(config={"arbitrary_types_allowed": True})
    def get_prompt(self, label: Label) -> str:
        """Prepare the prompt for the LLM based on label and rule data."""
        return settings.prompt_template_env.get_template(
            "compliance_verification.md"
        ).render(
            rule_data=self.rule.model_dump_json(exclude_none=True),
            label_data=LabelEvaluationContext.model_validate(label).model_dump_json(
                exclude_none=True
            ),
        )

    @validate_call(config={"arbitrary_types_allowed": True})
    async def evaluate(self, label: Label) -> ComplianceResult:
        if self.instructor is None:
            raise ValueError("AsyncInstructor is required for LLMEvaluator")

        response, _ = await self.instructor.chat.completions.create_with_completion(
            model=settings.AZURE_OPENAI_MODEL,
            response_model=ComplianceResult,
            messages=[{"role": "user", "content": self.get_prompt(label)}],
        )

        return response
