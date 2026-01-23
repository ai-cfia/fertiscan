"""Label route tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from tests.factories.label import LabelFactory
from tests.factories.product import ProductFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestUpdateLabelReviewStatus:
    def test_update_review_status_to_completed_without_product(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that completing a label without product_id returns 400."""
        user = LabelFactory().created_by
        label = LabelFactory(created_by=user, standalone=True)
        assert label.product_id is None
        headers = authentication_token_from_email(client=client, email=user.email, db=db)
        data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            headers=headers,
            json=data,
        )
        assert response.status_code == 400
        assert "product" in response.json()["detail"].lower()


    def test_update_review_status_to_completed_with_product(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that completing a label with product_id succeeds."""
        user = LabelFactory().created_by
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        assert label.product_id is not None
        assert label.product_id == product.id
        headers = authentication_token_from_email(client=client, email=user.email, db=db)
        data = {"review_status": "completed"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["review_status"] == "completed"


    def test_update_review_status_to_in_progress_without_product(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that setting status to in_progress without product_id succeeds."""
        user = LabelFactory().created_by
        label = LabelFactory(created_by=user, standalone=True)
        assert label.product_id is None
        headers = authentication_token_from_email(client=client, email=user.email, db=db)
        data = {"review_status": "in_progress"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["review_status"] == "in_progress"


    def test_update_review_status_to_not_started_without_product(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that setting status to not_started without product_id succeeds."""
        user = LabelFactory().created_by
        label = LabelFactory(created_by=user, standalone=True, in_progress=True)
        assert label.product_id is None
        headers = authentication_token_from_email(client=client, email=user.email, db=db)
        data = {"review_status": "not_started"}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/review-status",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["review_status"] == "not_started"
