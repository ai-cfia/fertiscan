"""Registration number evaluator."""

from pydantic import validate_call

from app.db.models.label import Label
from app.evaluators.base import RuleEvaluator
from app.schemas.label import ComplianceResult


@RuleEvaluator.register("REGISTRATION_NUMBER_PRESENT")
class RegistrationNumberEvaluator(RuleEvaluator):
    @validate_call(config={"arbitrary_types_allowed": True})
    async def evaluate(self, label: Label) -> ComplianceResult:
        """Verify if the registration number is present in the label data."""
        if not label.label_data:
            return ComplianceResult(
                is_compliant=False,
                explanation_en="Label data is missing.",
                explanation_fr="Les données de l'étiquette sont manquantes.",
            )

        registration_number_data = label.label_data.registration_number

        if registration_number_data is None:
            is_compliant = False
        elif isinstance(registration_number_data, str):
            is_compliant = bool(registration_number_data.strip())
        else:
            is_compliant = True

        if is_compliant:
            return ComplianceResult(
                is_compliant=True,
                explanation_en="Registration number is present.",
                explanation_fr="Le numéro d'enregistrement est présent.",
            )
        else:
            return ComplianceResult(
                is_compliant=False,
                explanation_en="Registration number is missing.",
                explanation_fr="Le numéro d'enregistrement est manquant.",
            )
