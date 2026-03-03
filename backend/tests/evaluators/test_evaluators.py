import os
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.db.models.rule import Rule
from app.evaluators.base import RuleEvaluator
from app.evaluators.guaranteed_analysis import GuaranteedAnalysisEvaluator
from app.evaluators.llm import LLMEvaluator
from app.evaluators.lot_number import LotNumberEvaluator
from sqlalchemy.orm import Session
from tests.factories.rule import RuleFactory

from app.config import settings
from app.dependencies.instructor import get_instructor
from app.schemas.label import ComplianceResult
from tests.factories.fertilizer_label_data import FertilizerLabelDataFactory
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory


@pytest.mark.usefixtures("setup_db")
class TestRuleEvaluatorRegistry:
    def test_registry_and_factory(self, db: Session):
        # Fetch actual seeded rules from rule_data.json
        organic_matter_rule = (
            db.query(Rule).filter_by(reference_number="FzR: 15.(1)(i)").first()
        )
        lot_number_rule = (
            db.query(Rule).filter_by(reference_number="FzR: 16.(1)(j)").first()
        )
        guaranteed_analysis_rule = (
            db.query(Rule).filter_by(reference_number="FzR: 16.(1)(g)").first()
        )

        assert organic_matter_rule is not None, "Rule FzR: 15.(1)(i) not seeded"
        assert lot_number_rule is not None, "Rule FzR: 16.(1)(j) not seeded"
        assert guaranteed_analysis_rule is not None, "Rule FzR: 16.(1)(g) not seeded"

        evaluator_llm = RuleEvaluator.get_evaluator(organic_matter_rule)
        evaluator_lot = RuleEvaluator.get_evaluator(lot_number_rule)
        evaluator_ga = RuleEvaluator.get_evaluator(guaranteed_analysis_rule)

        assert isinstance(evaluator_llm, LLMEvaluator)
        assert isinstance(evaluator_lot, LotNumberEvaluator)
        assert isinstance(evaluator_ga, GuaranteedAnalysisEvaluator)
        assert evaluator_llm.rule == organic_matter_rule
        assert evaluator_lot.rule == lot_number_rule
        assert evaluator_ga.rule == guaranteed_analysis_rule

    def test_constructor_guard(self, db: Session):
        wrong_rule = RuleFactory.create(session=db, evaluator_code="NITROGEN_CHECK")

        with pytest.raises(ValueError, match="Cannot use LotNumberEvaluator"):
            LotNumberEvaluator(rule=wrong_rule)


@pytest.mark.asyncio
@pytest.mark.usefixtures("setup_db")
class TestLotNumberEvaluator:
    async def test_evaluate_compliant(self, db: Session):
        rule = RuleFactory.create(session=db, evaluator_code="LOT_NUMBER_PRESENT")
        label = LabelFactory.create(session=db)
        LabelDataFactory.create(session=db, label=label, lot_number="LOT-123")

        evaluator = LotNumberEvaluator(rule=rule)
        result = await evaluator.evaluate(label)

        assert result.is_compliant is True
        assert "present" in result.explanation_en.lower()

    async def test_evaluate_non_compliant_empty(self, db: Session):
        rule = RuleFactory.create(session=db, evaluator_code="LOT_NUMBER_PRESENT")
        label = LabelFactory.create(session=db)
        LabelDataFactory.create(session=db, label=label, lot_number="   ")

        evaluator = LotNumberEvaluator(rule=rule)
        result = await evaluator.evaluate(label)

        assert result.is_compliant is False
        assert "missing" in result.explanation_en.lower()

    async def test_evaluate_non_compliant_none(self, db: Session):
        rule = RuleFactory.create(session=db, evaluator_code="LOT_NUMBER_PRESENT")
        label = LabelFactory.create(session=db)
        LabelDataFactory.create(session=db, label=label, lot_number=None)

        evaluator = LotNumberEvaluator(rule=rule)
        result = await evaluator.evaluate(label)

        assert result.is_compliant is False


@pytest.mark.asyncio
@pytest.mark.usefixtures("setup_db")
class TestLLMEvaluator:
    async def test_get_prompt(self, db: Session):
        rule = RuleFactory.create(session=db, evaluator_code="LLM_EVALUATION")
        label = LabelFactory.create(session=db)
        LabelDataFactory.create(session=db, label=label, brand_name_en="Organic Bloom")

        evaluator = LLMEvaluator(rule=rule)
        prompt = evaluator.get_prompt(label)

        assert "Organic Bloom" in prompt
        assert rule.reference_number in prompt

    async def test_evaluate(self, db: Session):
        rule = RuleFactory.create(session=db, evaluator_code="LLM_EVALUATION")
        label = LabelFactory.create(session=db)

        mock_instructor = MagicMock()
        mock_instructor.chat = MagicMock()
        mock_instructor.chat.completions = MagicMock()

        mock_response = ComplianceResult(
            is_compliant=True,
            explanation_en="Valid organic matter.",
            explanation_fr="Matière organique valide.",
        )
        mock_instructor.chat.completions.create_with_completion = AsyncMock(
            return_value=(mock_response, MagicMock())
        )

        evaluator = LLMEvaluator(rule=rule, instructor=mock_instructor)
        result = await evaluator.evaluate(label)

        assert result.is_compliant is True
        assert result.explanation_en == "Valid organic matter."

        # Verify instructor was called with the prompt
        mock_instructor.chat.completions.create_with_completion.assert_called_once()
        call_kwargs = (
            mock_instructor.chat.completions.create_with_completion.call_args.kwargs
        )
        assert "Regulatory Compliance Engine" in call_kwargs["messages"][0]["content"]


@pytest.mark.asyncio
@pytest.mark.usefixtures("setup_db")
@pytest.mark.skipif(
    os.getenv("CI") == "true" or not settings.AZURE_OPENAI_API_KEY,
    reason="Integration test requires API keys and should not run in CI",
)
class TestRealLLMIntegration:
    async def test_evaluate_compliant(self, db: Session):
        """Integration test using a real LLM call for a compliant case."""
        organic_matter_rule = (
            db.query(Rule).filter_by(reference_number="FzR: 15.(1)(i)").first()
        )
        label = LabelFactory.create(session=db)

        # Provide moisture content in guaranteed analysis
        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            guaranteed_analysis={
                "title_en": "Guaranteed Analysis",
                "is_minimum": True,
                "nutrients": [
                    {"name_en": "Moisture (maximum)", "value": 15.5, "unit": "%"}
                ],
            },
        )

        evaluator = LLMEvaluator(rule=organic_matter_rule, instructor=get_instructor())
        result = await evaluator.evaluate(label)

        assert result.is_compliant is True
        assert result.explanation_en != ""

    async def test_evaluate_non_compliant(self, db: Session):
        """Integration test: non-compliance when info is missing from ingredients and analysis."""
        organic_matter_rule = (
            db.query(Rule).filter_by(reference_number="FzR: 15.(1)(i)").first()
        )
        label = LabelFactory.create(session=db)
        # Provide data that doesn't include organic matter or moisture anywhere
        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            ingredients=[
                {"name_en": "Sand", "value": "100", "unit": "%"},
            ],
            guaranteed_analysis={
                "title_en": "Guaranteed Analysis",
                "is_minimum": True,
                "nutrients": [
                    {"name_en": "Total Nitrogen (N)", "value": 10.0, "unit": "%"}
                ],
            },
        )

        evaluator = LLMEvaluator(rule=organic_matter_rule, instructor=get_instructor())
        result = await evaluator.evaluate(label)

        assert result.is_compliant is False
        assert result.explanation_en != ""

    async def test_evaluate_ingredient_compliant(self, db: Session):
        """Integration test: compliance when info is in ingredients list instead of analysis."""
        organic_matter_rule = (
            db.query(Rule).filter_by(reference_number="FzR: 15.(1)(i)").first()
        )
        label = LabelFactory.create(session=db)

        # Provide organic matter in the ingredients list
        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            ingredients=[
                {"name_en": "Organic Matter", "value": "40", "unit": "%"},
                {"name_en": "Peat Moss", "value": "60", "unit": "%"},
            ],
        )

        evaluator = LLMEvaluator(rule=organic_matter_rule, instructor=get_instructor())
        result = await evaluator.evaluate(label)

        # The LLM should find "Organic Matter" in the ingredients and mark as compliant
        assert result.is_compliant is True
        assert result.explanation_en != ""


@pytest.mark.asyncio
@pytest.mark.usefixtures("setup_db")
class TestGuaranteedAnalysisEvaluator:
    """Tests for the GuaranteedAnalysisEvaluator which checks for the presence of guaranteed analysis in the fertilizer label data."""

    async def test_evaluate_compliant(self, db: Session):
        rule = RuleFactory.create(
            session=db, evaluator_code="GUARANTEED_ANALYSIS_PRESENT"
        )
        label = LabelFactory.create(session=db)
        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            guaranteed_analysis={
                "title_en": "Guaranteed Analysis",
                "is_minimum": True,
                "nutrients": [
                    {"name_en": "Total Nitrogen (N)", "value": 10.0, "unit": "%"}
                ],
            },
        )

        evaluator = GuaranteedAnalysisEvaluator(rule=rule)
        result = await evaluator.evaluate(label)

        assert result.is_compliant is True
        assert "present" in result.explanation_en.lower()

    async def test_evaluate_non_compliant(self, db: Session):
        rule = RuleFactory.create(
            session=db, evaluator_code="GUARANTEED_ANALYSIS_PRESENT"
        )
        label = LabelFactory.create(session=db)
        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            guaranteed_analysis=None,
        )

        evaluator = GuaranteedAnalysisEvaluator(rule=rule)
        result = await evaluator.evaluate(label)

        assert result.is_compliant is False
        assert "missing" in result.explanation_en.lower()

    async def test_evaluate_non_compliant_no_fertilizer_data(self, db: Session):
        rule = RuleFactory.create(
            session=db, evaluator_code="GUARANTEED_ANALYSIS_PRESENT"
        )
        label = LabelFactory.create(session=db)

        evaluator = GuaranteedAnalysisEvaluator(rule=rule)
        result = await evaluator.evaluate(label)

        assert result.is_compliant is False
        assert "missing" in result.explanation_en.lower()
