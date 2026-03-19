import logging
import os
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlmodel import Session, select

from app.config import settings
from app.db.models.enums import ComplianceStatus
from app.db.models.requirement import Requirement
from app.dependencies.instructor import get_instructor
from app.schemas.label import ComplianceResult
from app.schemas.label_data import BilingualText
from app.services.compliance import evaluate_requirement
from tests.factories.fertilizer_label_data import FertilizerLabelDataFactory
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.requirement import RequirementFactory

logger = logging.getLogger(__name__)


@pytest.mark.asyncio
@pytest.mark.usefixtures("setup_db")
class TestEvaluateRequirement:
    """Tests for the evaluate_requirement service function."""

    async def test_evaluate_requirement_mocked(self, db: Session):
        """Test successful evaluation with mocked instructor."""
        requirement = RequirementFactory.create()
        label = LabelFactory.create()
        LabelDataFactory.create(label=label, brand_name={"en": "Organic Bloom"})

        mock_instructor = MagicMock()
        mock_response = ComplianceResult(
            status=ComplianceStatus.COMPLIANT,
            explanation=BilingualText(
                en="Valid organic matter.",
                fr="Matière organique valide.",
            ),
        )
        mock_instructor.chat.completions.create_with_completion = AsyncMock(
            return_value=(mock_response, MagicMock())
        )

        result = await evaluate_requirement(mock_instructor, label, requirement)

        assert result.status == ComplianceStatus.COMPLIANT
        assert result.explanation.en == "Valid organic matter."

        # Verify instructor was called with the prompt
        mock_instructor.chat.completions.create_with_completion.assert_called_once()
        call_kwargs = (
            mock_instructor.chat.completions.create_with_completion.call_args.kwargs
        )
        user_prompt = next(
            msg["content"] for msg in call_kwargs["messages"] if msg["role"] == "user"
        )
        assert "# Compliance Verification" in user_prompt


@pytest.mark.asyncio
@pytest.mark.usefixtures("setup_db")
@pytest.mark.skipif(
    os.getenv("CI") == "true" or not settings.AZURE_OPENAI_API_KEY,
    reason="Integration test requires API keys and should not run in CI",
)
class TestRealComplianceIntegration:
    """Integration tests using a real LLM call."""

    async def test_evaluate_guaranteed_analysis_compliant(self, db: Session):
        """Integration test using a real LLM call for Guaranteed Analysis requirement."""
        requirement = db.exec(
            select(Requirement).where(
                Requirement.title_en == "Guaranteed Analysis Presence"
            )
        ).first()
        assert requirement is not None

        label = LabelFactory.create()
        FertilizerLabelDataFactory.create(
            label=label,
            guaranteed_analysis={
                "title": {"en": "Guaranteed Analysis"},
                "is_minimum": True,
                "nutrients": [
                    {"name": {"en": "Total Nitrogen (N)"}, "value": 10.0, "unit": "%"}
                ],
            },
        )
        db.flush()

        result = await evaluate_requirement(get_instructor(), label, requirement)
        logger.info(f"Guaranteed Analysis Result: {result.status}")
        logger.info(f"Explanation: {result.explanation.en}")

        assert result.status == ComplianceStatus.COMPLIANT
        assert result.explanation.en != ""

    async def test_evaluate_lot_number_missing(self, db: Session):
        """Integration test: non-compliance when lot number is missing."""
        requirement = db.exec(
            select(Requirement).where(Requirement.title_en == "Lot Number Presence")
        ).first()
        assert requirement is not None

        label = LabelFactory.create()
        # Explicitly set empty lot number, but provide product name to establish context
        LabelDataFactory.create(
            label=label,
            brand_name={"en": "Test Brand"},
            product_name={"en": "Test Fertilizer"},
            lot_number=None,
        )
        db.flush()

        result = await evaluate_requirement(get_instructor(), label, requirement)
        logger.info(f"Lot Number Result: {result.status}")
        logger.info(f"Explanation: {result.explanation.en}")

        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert result.explanation.en != ""
