"""Tests for label compliance evaluation endpoint."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlmodel import Session

from app.config import settings
from app.schemas.label import ComplianceResult
from tests.factories.fertilizer_label_data import FertilizerLabelDataFactory
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.factories.product_type import ProductTypeFactory
from tests.factories.requirement import RequirementFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
    authentication_token_from_email_async,
)


@pytest.mark.usefixtures("override_dependencies")
class TestEvaluateNonCompliance:
    """Tests for label compliance evaluation endpoint."""

    @pytest.fixture(autouse=True)
    def setup_mock_instructor(self, mock_instructor: MagicMock):
        """Override the default mock_instructor for LLM tests."""
        mock_response = ComplianceResult(
            status="compliant",
            explanation={"en": "Compliant.", "fr": "Conforme."},
        )
        # Re-mock the specific method we need for LLM evaluator
        mock_instructor.chat.completions.create_with_completion = AsyncMock(
            return_value=(mock_response, MagicMock())
        )
        return mock_instructor

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
        FertilizerLabelDataFactory.create(session=db, label=label)
        LabelImageFactory.create(session=db, label_id=label.id)

        requirement = RequirementFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "compliant"

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
        FertilizerLabelDataFactory.create(session=db, label=label)
        LabelImageFactory.create(session=db, label_id=label.id)

        requirement = RequirementFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in [
            "compliant",
            "non_compliant",
            "not_applicable",
        ]

    def test_evaluate_fails_when_label_data_missing(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test evaluate fails when label_data is missing (400)."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        label = LabelFactory.create(
            session=db,
            product_type_id=product_type.id,
            review_status="in_progress",
        )

        requirement = RequirementFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement.id}",
            headers=headers,
        )
        assert response.status_code == 400

    def test_evaluate_fails_when_fertilizer_label_data_missing(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test evaluate fails when fertilizer_label_data is missing for fertilizer (400)."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        label = LabelFactory.create(
            session=db,
            product_type_id=product_type.id,
            review_status="in_progress",
        )
        LabelDataFactory.create(session=db, label=label)

        requirement = RequirementFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement.id}",
            headers=headers,
        )
        assert response.status_code == 400

    def test_evaluate_succeeds_when_not_completed_but_has_data(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test evaluate succeeds with label_data + fertilizer_label_data even when review_status != completed."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        label = LabelFactory.create(
            session=db,
            product_type_id=product_type.id,
            review_status="in_progress",
        )
        LabelDataFactory.create(session=db, label=label)
        FertilizerLabelDataFactory.create(session=db, label=label)

        requirement = RequirementFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement.id}",
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "compliant"

    def test_evaluate_non_compliance_authentication_required(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that authentication is required."""
        label = LabelFactory.create(session=db, review_status="completed")
        requirement = RequirementFactory.create(session=db)

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement.id}"
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
                "title": {"en": "Guaranteed Analysis"},
                "is_minimum": True,
                "nutrients": [
                    {"name": {"en": "Total Nitrogen (N)"}, "value": 10.0, "unit": "%"}
                ],
            },
        )

        LabelImageFactory.create(session=db, label_id=label.id)

        requirement = RequirementFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "compliant"

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

        requirement = RequirementFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement.id}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "status" in data


@pytest.mark.usefixtures("override_dependencies")
class TestEvaluateNonComplianceLLM:
    """Tests for compliance evaluation using LLM evaluator."""

    @pytest.fixture(autouse=True)
    def setup_mock_instructor(self, mock_instructor: MagicMock):
        """Override the default mock_instructor for LLM tests."""
        mock_response = ComplianceResult(
            status="compliant",
            explanation={"en": "Compliant.", "fr": "Conforme."},
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
        product_type = ProductTypeFactory.create(session=db)
        label = LabelFactory.create(
            session=db,
            product_type_id=product_type.id,
            review_status="completed",
        )
        LabelDataFactory.create(session=db, label=label)
        FertilizerLabelDataFactory.create(session=db, label=label)

        requirement = RequirementFactory.create(session=db)

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )

        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement.id}",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "compliant"

    @pytest.mark.asyncio
    async def test_evaluate_non_compliance_multiple_requirements(
        self,
        async_client: AsyncClient,
        db: Session,
    ) -> None:
        """Test evaluating multiple requirements via separate requests."""
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
        FertilizerLabelDataFactory.create(session=db, label=label)
        LabelImageFactory.create(session=db, label_id=label.id)

        requirement_lot = RequirementFactory.create(session=db)
        requirement_llm = RequirementFactory.create(session=db)

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )

        response1 = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement_lot.id}",
            headers=headers,
        )
        assert response1.status_code == 200
        assert response1.json()["status"] == "compliant"

        response2 = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/evaluate-non-compliance/{requirement_llm.id}",
            headers=headers,
        )
        assert response2.status_code == 200
        assert response2.json()["status"] == "compliant"
