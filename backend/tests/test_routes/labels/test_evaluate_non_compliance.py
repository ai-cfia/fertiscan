"""Tests for label compliance evaluation endpoint."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.orm import Session
from sqlmodel import select

from app.config import settings
from app.db.models.rule import Rule
from app.schemas.label import ComplianceResult
from tests.factories.fertilizer_label_data import FertilizerLabelDataFactory
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.factories.product_type import ProductTypeFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
    authentication_token_from_email_async,
)


@pytest.mark.usefixtures("override_dependencies")
class TestEvaluateNonCompliance:
    """Tests for label compliance evaluation endpoint."""

    def test_evaluate_non_compliance_lot_number_success(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test evaluating compliance with a lot number present."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            product_type_id=product_type.id,
            review_status="completed",
        )
        LabelDataFactory.create(session=db, label=label, lot_number="LOT-12345")
        LabelImageFactory.create(session=db, label_id=label.id)

        rule = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        ).first()
        assert rule is not None

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance?rule_ids={rule.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert str(rule.id) in data["results"]
        assert data["results"][str(rule.id)]["is_compliant"] is True

    def test_evaluate_non_compliance_lot_number_missing(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test evaluating compliance with a lot number missing."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            product_type_id=product_type.id,
            review_status="completed",
        )
        LabelDataFactory.create(session=db, label=label, lot_number="")
        LabelImageFactory.create(session=db, label_id=label.id)

        rule = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        ).first()
        assert rule is not None

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance?rule_ids={rule.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert str(rule.id) in data["results"]
        assert data["results"][str(rule.id)]["is_compliant"] is False

    @pytest.mark.asyncio
    async def test_evaluate_non_compliance_label_not_completed(
        self,
        async_client: AsyncClient,
        db: Session,
    ) -> None:
        """Test evaluating compliance when label is not completed (412)."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, review_status="in_progress")

        rule = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        ).first()
        assert rule is not None

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )

        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance?rule_ids={rule.id}",
            headers=headers,
        )
        assert response.status_code == 412

    def test_evaluate_non_compliance_authentication_required(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that authentication is required."""
        label = LabelFactory.create(session=db, review_status="completed")
        rule = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        ).first()
        assert rule is not None

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance?rule_ids={rule.id}"
        )
        assert response.status_code == 401

    def test_evaluate_non_compliance_guaranteed_analysis_success(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test evaluating compliance with guaranteed analysis present."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            product_type_id=product_type.id,
            review_status="completed",
        )
        LabelDataFactory.create(session=db, label=label)
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

        LabelImageFactory.create(session=db, label_id=label.id)

        rule = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 16.(1)(g)")
        ).first()
        assert rule is not None

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance?rule_ids={rule.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert str(rule.id) in data["results"]
        assert data["results"][str(rule.id)]["is_compliant"] is True

    def test_evaluate_non_compliance_guaranteed_analysis_missing(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test evaluating compliance with guaranteed analysis missing."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            product_type_id=product_type.id,
            review_status="completed",
        )
        LabelDataFactory.create(session=db, label=label)
        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            guaranteed_analysis=None,  # Missing guaranteed analysis
        )

        LabelImageFactory.create(session=db, label_id=label.id)

        rule = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 16.(1)(g)")
        ).first()
        assert rule is not None

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance?rule_ids={rule.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert str(rule.id) in data["results"]
        assert data["results"][str(rule.id)]["is_compliant"] is False


@pytest.mark.usefixtures("override_dependencies")
class TestEvaluateNonComplianceLLM:
    """Tests for compliance evaluation using LLM evaluator."""

    @pytest.fixture(autouse=True)
    def setup_mock_instructor(self, mock_instructor: MagicMock):
        """Override the default mock_instructor for LLM tests."""
        mock_response = ComplianceResult(
            is_compliant=True,
            explanation_en="Compliant.",
            explanation_fr="Conforme.",
        )
        # Re-mock the specific method we need for LLM evaluator
        mock_instructor.chat.completions.create_with_completion = AsyncMock(
            return_value=(mock_response, MagicMock())
        )
        return mock_instructor

    @pytest.mark.asyncio
    async def test_evaluate_non_compliance_llm_success(
        self,
        async_client: AsyncClient,
        db: Session,
    ) -> None:
        """Test successful compliance evaluation using LLM."""
        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, review_status="completed")
        LabelDataFactory.create(session=db, label=label)

        rule = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        ).first()
        assert rule is not None

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )

        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance?rule_ids={rule.id}",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["results"][str(rule.id)]["is_compliant"] is True

    @pytest.mark.asyncio
    async def test_evaluate_non_compliance_multiple_rules(
        self,
        async_client: AsyncClient,
        db: Session,
    ) -> None:
        """Test evaluating multiple rules (programmatic + LLM) at once."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            product_type_id=product_type.id,
            review_status="completed",
        )
        LabelDataFactory.create(session=db, label=label, lot_number="LOT-12345")
        LabelImageFactory.create(session=db, label_id=label.id)

        # 1. Programmatic Rule (Lot Number)
        rule_lot = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        ).first()
        # 2. LLM Rule (Organic Matter)
        rule_llm = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        ).first()

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )

        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance"
            f"?rule_ids={rule_lot.id}&rule_ids={rule_llm.id}",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert str(rule_lot.id) in data["results"]
        assert str(rule_llm.id) in data["results"]
        assert data["results"][str(rule_lot.id)]["is_compliant"] is True
        assert data["results"][str(rule_llm.id)]["is_compliant"] is True
