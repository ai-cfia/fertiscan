"""Verify routes tests."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.orm import Session
from sqlmodel import select

import app.dependencies.instructor as deps
from app.config import settings
from app.db.models.rule import Rule
from app.main import app
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
class TestVerifyLotNumber:
    """Tests for verifying only one product."""

    def test_verify_product_with_lot_number(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test verifying a product with a lot_number."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="LOT-12345")
        LabelImageFactory.create(session=db, label_id=label.id)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify/FzR: 16.(1)(j)",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is True

    def test_verify_product_without_lot_number(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test verifying a product without a lot_number."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="")
        LabelImageFactory.create(session=db, label_id=label.id)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify/FzR: 16.(1)(j)",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is False

    def test_verify_product_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test verifying a product that the label is in progress"""

        user = UserFactory.create(session=db)
        label = LabelFactory.create(session=db, review_status="in_progress")
        LabelDataFactory.create(session=db, label=label, lot_number="")

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify/FzR: 16.(1)(j)",
            headers=headers,
        )
        assert response.status_code == 412

    def test_authentication_required(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that authentication is required to verify a product."""

        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="LOT-12345")
        LabelImageFactory.create(session=db, label_id=label.id)
        label_id = label.id

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label_id}/verify/FzR: 16.(1)(j)"
        )
        assert response.status_code == 401

    def test_verify_three_time_the_same_product(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test verifying the same product three times without lot number and with lot number ."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        label_data = LabelDataFactory.create(session=db, label=label, lot_number="")
        LabelImageFactory.create(session=db, label_id=label.id)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify/FzR: 16.(1)(j)",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is False

        label_data.lot_number = None
        db.flush()
        db.refresh(label_data)

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify/FzR: 16.(1)(j)",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is False

        label_data.lot_number = "LOT-12345"
        db.flush()
        db.refresh(label_data)

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify/FzR: 16.(1)(j)",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is True

    def test_label_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test verifying a product when the label does not exist"""

        user = UserFactory.create(session=db)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/00000000-0000-0000-0000-000000000000/verify/FzR: 16.(1)(j)",
            headers=headers,
        )
        assert response.status_code == 404

    def test_verify_product_with_whitespace_lot_number(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test verifying a product with whitespace-only lot_number."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="   ")
        LabelImageFactory.create(session=db, label_id=label.id)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify/FzR:%3A+16.(1)(j)",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is False

    def test_verify_product_with_padded_lot_number(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test verifying a product with padded lot_number."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="  LOT-12345  ")
        LabelImageFactory.create(session=db, label_id=label.id)

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify/FzR: 16.(1)(j)",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is True


@pytest.mark.usefixtures("override_dependencies")
class TestsVerifyOrganicMatterCompliants:
    """Tests for verifying organic matter content rules. These tests use a mock instructor to simulate compliant"""

    # =================================================== Compliant ========================================
    @staticmethod
    @pytest.fixture(scope="function", autouse=True)
    def setup_mock_instructor(override_dependencies):
        mock = MagicMock()
        mock.chat = MagicMock()
        mock.chat.completions = MagicMock()

        mock_response = ComplianceResult(
            is_compliant=True,
            explanation_en="The organic matter content is compliant with the regulation.",
            explanation_fr="La teneur en matière organique est conforme à la réglementation.",
        )

        mock.chat.completions.create_with_completion = AsyncMock(
            return_value=(mock_response, {})
        )

        app.dependency_overrides[deps.get_instructor] = lambda: mock

        try:
            yield mock
        finally:
            app.dependency_overrides.pop(deps.get_instructor, None)

    @pytest.mark.asyncio
    async def test_verify_organic_matter_success(
        self,
        async_client: AsyncClient,
        db: Session,
    ) -> None:
        """Test verifying organic matter content successfully."""

        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="  LOT-12345  ")
        LabelImageFactory.create(session=db, label_id=label.id)

        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            label_id=label.id,
            ingredients=[
                {"laine brute de mouton": "100%"},
            ],
            guaranteed_analysis={
                "Total nitrogen (N)": "10%",
                "Soluble potash (K2O)": "4%",
                "Organic matter": "61.5%",
                "Maximum moisture content": "14.8%",
            },
        )
        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        # Test with mock
        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule = db.scalars(stmt).first()
        assert rule is not None
        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify?rule_ids={rule.id}",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert str(rule.id) in data
        assert data[str(rule.id)]["is_compliant"] is True
        # Test with no ai
        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule = db.scalars(stmt).first()
        assert rule is not None
        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify?rule_ids={rule.id}",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert str(rule.id) in data
        assert data[str(rule.id)]["is_compliant"] is True

    @pytest.mark.asyncio
    async def test_authentication_required(
        self,
        async_client: AsyncClient,
        db: Session,
    ) -> None:
        """Test verifying organic matter content successfully."""

        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="  LOT-12345  ")
        LabelImageFactory.create(session=db, label_id=label.id)

        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            label_id=label.id,
            ingredients=[
                {"laine brute de mouton": "100%"},
            ],
            guaranteed_analysis={
                "Total nitrogen (N)": "10%",
                "Soluble potash (K2O)": "4%",
                "Organic matter": "61.5%",
                "Maximum moisture content": "14.8%",
            },
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule = db.scalars(stmt).first()
        assert rule is not None
        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify?rule_ids={rule.id}",
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_verify_label_not_completed(
        self,
        async_client: AsyncClient,
        db: Session,
    ) -> None:
        """Test verifying organic matter content when label is not completed."""

        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="in_progress"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="  LOT-12345  ")
        LabelImageFactory.create(session=db, label_id=label.id)

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule = db.scalars(stmt).first()
        assert rule is not None
        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify?rule_ids={rule.id}",
            headers=headers,
        )

        assert response.status_code == 412


@pytest.mark.usefixtures("override_dependencies")
class TestsVerifyOrganicMatterNonCompliants:
    """ "Tests for verifying organic matter content rules. These tests use a mock instructor to simulate non-compliant"""

    # =================================================== No compliant ========================================

    @staticmethod
    @pytest.fixture(scope="function", autouse=True)
    def setup_mock_instructor_false(override_dependencies):
        mock = MagicMock()
        mock.chat = MagicMock()
        mock.chat.completions = MagicMock()

        mock_response = ComplianceResult(
            is_compliant=False,
            explanation_en="The organic matter content is not compliant with the regulation.",
            explanation_fr="La teneur en matière organique n'est pas conforme à la réglementation.",
        )

        mock.chat.completions.create_with_completion = AsyncMock(
            return_value=(mock_response, {})
        )

        app.dependency_overrides[deps.get_instructor] = lambda: mock

        try:
            yield mock
        finally:
            app.dependency_overrides.pop(deps.get_instructor, None)

    @pytest.mark.asyncio
    async def test_verify_organic_matter_not_compliant(
        self,
        async_client: AsyncClient,
        db: Session,
    ) -> None:
        """Test verifying organic matter content that is not compliant."""

        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="  LOT-12345  ")
        LabelImageFactory.create(session=db, label_id=label.id)

        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            label_id=label.id,
            ingredients=[
                {"laine brute de mouton": "100%"},
            ],
            guaranteed_analysis={
                "Total nitrogen (N)": "10%",
                "Soluble potash (K2O)": "4%",
            },
        )
        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule = db.scalars(stmt).first()
        assert rule is not None
        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify?rule_ids={rule.id}",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert str(rule.id) in data
        assert data[str(rule.id)]["is_compliant"] is False

    @pytest.mark.asyncio
    async def test_verify_all_non_compliance_data_items(
        self,
        async_client: AsyncClient,
        db: Session,
    ) -> None:
        """Test verifying all non-compliance data items of a label."""
        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="  LOT-12345  ")
        LabelImageFactory.create(session=db, label_id=label.id)

        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            label_id=label.id,
            ingredients=[
                {"laine brute de mouton": "100%"},
            ],
            guaranteed_analysis={
                "Total nitrogen (N)": "10%",
                "Soluble potash (K2O)": "4%",
            },
        )

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        rule1 = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        ).first()
        rule2 = db.scalars(
            select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        ).first()
        assert rule1 is not None
        assert rule2 is not None
        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify?rule_ids={rule1.id}&rule_ids={rule2.id}",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert str(rule1.id) in data
        assert str(rule2.id) in data
        assert data[str(rule1.id)]["is_compliant"] is False
        assert data[str(rule2.id)]["is_compliant"] is True

    @pytest.mark.asyncio
    async def test_rule_id_error_for_verification(
        self,
        async_client: AsyncClient,
        db: Session,
    ) -> None:
        """Test verifying a label with an invalid rule id."""

        user = UserFactory.create(session=db)
        product_type = ProductTypeFactory.create(session=db)
        product = ProductFactory.create(session=db, product_type_id=product_type.id)
        label = LabelFactory.create(
            session=db, product_id=product.id, review_status="completed"
        )
        LabelDataFactory.create(session=db, label=label, lot_number="  LOT-12345  ")
        LabelImageFactory.create(session=db, label_id=label.id)

        FertilizerLabelDataFactory.create(
            session=db,
            label=label,
            label_id=label.id,
            ingredients=[
                {"laine brute de mouton": "100%"},
            ],
            guaranteed_analysis={
                "Total nitrogen (N)": "10%",
                "Soluble potash (K2O)": "4%",
            },
        )

        headers = await authentication_token_from_email_async(
            client=async_client, email=user.email, db=db
        )
        response = await async_client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify?rule_ids=00000000-0000-0000-0000-000000000123",
            headers=headers,
        )

        assert response.status_code == 404
        assert (
            response.json()["detail"]
            == "Rule with id 00000000-0000-0000-0000-000000000123 not found"
        )
