"""Guaranteed analysis evaluator to check if the guaranteed analysis is present in the label data."""

from pydantic import validate_call

from app.db.models.label import Label
from app.evaluators.base import RuleEvaluator
from app.schemas.label import ComplianceResult


@RuleEvaluator.register("GUARANTEED_ANALYSIS_PRESENT")
class GuaranteedAnalysisEvaluator(RuleEvaluator):
    @validate_call(config={"arbitrary_types_allowed": True})
    async def evaluate(self, label: Label) -> ComplianceResult:
        """Evaluate if the guaranteed analysis is present in the label data."""
        if not label.fertilizer_label_data:
            return ComplianceResult(
                is_compliant=False,
                explanation_en="Fertilizer Label data is missing.",
                explanation_fr="Les données de l'étiquette du fertilisant sont manquantes.",
            )

        guaranteed_analysis = label.fertilizer_label_data.guaranteed_analysis

        if guaranteed_analysis is None:
            is_compliant = False
        elif isinstance(guaranteed_analysis, str):
            is_compliant = bool(guaranteed_analysis.strip())
        else:
            is_compliant = True

        if is_compliant:
            return ComplianceResult(
                is_compliant=True,
                explanation_en="Guaranteed analysis is present.",
                explanation_fr="L'analyse garantie est présente.",
            )
        else:
            return ComplianceResult(
                is_compliant=False,
                explanation_en="Guaranteed analysis is missing.",
                explanation_fr="L'analyse garantie est manquante.",
            )
