"""Verify routes tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlmodel import select

from app.config import settings
from app.db.models.rule import Rule
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.label_image import LabelImageFactory
from tests.factories.product import ProductFactory
from tests.factories.product_type import ProductTypeFactory
from tests.factories.user import UserFactory
from tests.utils.user import (
    authentication_token_from_email,
)


@pytest.mark.usefixtures("override_dependencies")
class TestVerifyOneProduct:
    """Tests for verifying only one product."""

    def test_verify_product_with_lot_number(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test verifying a product with a lot_number."""
        user = UserFactory.create(session=db)

        product_type = ProductTypeFactory.create(session=db)

        product = ProductFactory.create(
            session=db,
            product_type_id=product_type.id,
        )

        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            review_status="completed",
        )

        LabelDataFactory.create(
            session=db,
            label=label,
            lot_number="LOT-12345",
        )

        LabelImageFactory.create(
            session=db,
            label_id=label.id,
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule = db.scalars(stmt).first()
        if rule is None:
            rule = Rule(
                reference_number="FzR: 16.(1)(j)",
                title_en="Lot number",
                title_fr="Numero de lot",
                description_en="Lot number must be present.",
                description_fr="Le numero de lot doit etre present.",
            )
            db.add(rule)

        db.commit()

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify",
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

        product = ProductFactory.create(
            session=db,
            product_type_id=product_type.id,
        )

        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            review_status="completed",
        )

        LabelDataFactory.create(
            session=db,
            label=label,
            lot_number="",
        )

        LabelImageFactory.create(
            session=db,
            label_id=label.id,
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule = db.scalars(stmt).first()
        if rule is None:
            rule = Rule(
                reference_number="FzR: 16.(1)(j)",
                title_en="Lot number",
                title_fr="Numero de lot",
                description_en="Lot number must be present.",
                description_fr="Le numero de lot doit etre present.",
            )
            db.add(rule)

        db.commit()

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify",
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

        label = LabelFactory.create(
            session=db,
            review_status="in_progress",
        )

        LabelDataFactory.create(
            session=db,
            label=label,
            lot_number="",
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule = db.scalars(stmt).first()
        if rule is None:
            rule = Rule(
                reference_number="FzR: 16.(1)(j)",
                title_en="Lot number",
                title_fr="Numero de lot",
                description_en="Lot number must be present.",
                description_fr="Le numero de lot doit etre present.",
            )
            db.add(rule)

        db.commit()

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify",
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

        product = ProductFactory.create(
            session=db,
            product_type_id=product_type.id,
        )

        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            review_status="completed",
        )

        LabelDataFactory.create(
            session=db,
            label=label,
            lot_number="LOT-12345",
        )

        LabelImageFactory.create(
            session=db,
            label_id=label.id,
        )
        label_id = label.id
        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule = db.scalars(stmt).first()
        if rule is None:
            rule = Rule(
                reference_number="FzR: 16.(1)(j)",
                title_en="Lot number",
                title_fr="Numero de lot",
                description_en="Lot number must be present.",
                description_fr="Le numero de lot doit etre present.",
            )
            db.add(rule)

        db.commit()

        response = client.get(f"{settings.API_V1_STR}/labels/{label_id}/verify")
        assert response.status_code == 401

    def test_verify_three_time_the_same_product(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test verifying the same product three times without lot number and with lot number ."""
        user = UserFactory.create(session=db)

        product_type = ProductTypeFactory.create(session=db)

        product = ProductFactory.create(
            session=db,
            product_type_id=product_type.id,
        )

        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            review_status="completed",
        )

        label_data = LabelDataFactory.create(
            session=db,
            label=label,
            lot_number="",
        )

        LabelImageFactory.create(
            session=db,
            label_id=label.id,
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule = db.scalars(stmt).first()
        if rule is None:
            rule = Rule(
                reference_number="FzR: 16.(1)(j)",
                title_en="Lot number",
                title_fr="Numero de lot",
                description_en="Lot number must be present.",
                description_fr="Le numero de lot doit etre present.",
            )
            db.add(rule)

        db.commit()

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is False

        label_data.lot_number = None
        db.add(label_data)
        db.commit()
        db.refresh(label_data)

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is False

        label_data.lot_number = "LOT-12345"
        db.add(label_data)
        db.commit()
        db.refresh(label_data)

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify",
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
            f"{settings.API_V1_STR}/labels/00000000-0000-0000-0000-000000000000/verify",
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

        product = ProductFactory.create(
            session=db,
            product_type_id=product_type.id,
        )

        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            review_status="completed",
        )

        LabelDataFactory.create(
            session=db,
            label=label,
            lot_number="   ",
        )

        LabelImageFactory.create(
            session=db,
            label_id=label.id,
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule = db.scalars(stmt).first()
        if rule is None:
            rule = Rule(
                reference_number="FzR: 16.(1)(j)",
                title_en="Lot number",
                title_fr="Numero de lot",
                description_en="Lot number must be present.",
                description_fr="Le numero de lot doit etre present.",
            )
            db.add(rule)

        db.commit()

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify",
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

        product = ProductFactory.create(
            session=db,
            product_type_id=product_type.id,
        )

        label = LabelFactory.create(
            session=db,
            product_id=product.id,
            review_status="completed",
        )

        LabelDataFactory.create(
            session=db,
            label=label,
            lot_number="  LOT-12345  ",
        )

        LabelImageFactory.create(
            session=db,
            label_id=label.id,
        )

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule = db.scalars(stmt).first()
        if rule is None:
            rule = Rule(
                reference_number="FzR: 16.(1)(j)",
                title_en="Lot number",
                title_fr="Numero de lot",
                description_en="Lot number must be present.",
                description_fr="Le numero de lot doit etre present.",
            )
            db.add(rule)

        db.commit()

        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )

        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/verify",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["is_compliant"] is True
