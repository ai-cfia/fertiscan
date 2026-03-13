"""Tests for label data endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from app.schemas.label_data import Contact
from tests.factories.label import LabelFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.product import ProductFactory
from tests.factories.user import UserFactory
from tests.utils.user import authentication_token_from_email


@pytest.mark.usefixtures("override_dependencies")
class TestCreateLabelData:
    """Tests for creating LabelData."""

    def test_create_label_data_basic(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating LabelData with basic fields."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data_in = {
            "brand_name": {"en": "Test Brand"},
            "product_name": {"en": "Test Product"},
            "registration_number": "2018161p",
        }
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json=data_in,
            headers=headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["brand_name"]["en"] == "Test Brand"
        assert data["product_name"]["en"] == "Test Product"
        assert data["registration_number"] == "2018161P"
        assert "id" not in data

        second_label = LabelFactory(created_by=user, product=product)

        data_in = {
            "brand_name": {"en": "Test Brand 2"},
            "product_name": {"en": "Test Product 2"},
            "registration_number": None,
        }
        response = client.post(
            f"{settings.API_V1_STR}/labels/{second_label.id}/data",
            json=data_in,
            headers=headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["brand_name"]["en"] == "Test Brand 2"
        assert data["product_name"]["en"] == "Test Product 2"
        assert data["registration_number"] is None

    def test_create_label_data_with_contacts(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating LabelData with contacts JSON field - verify proper conversion."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        contacts_data = [
            {
                "type": "manufacturer",
                "name": "Test Manufacturer Co.",
                "address": "123 Main St",
                "phone": "1-800-123-4567",
                "email": "contact@manufacturer.com",
                "website": "https://manufacturer.com",
            },
            {
                "type": "distributor",
                "name": "Test Distributor Inc.",
                "email": "info@distributor.com",
            },
        ]
        data_in = {
            "brand_name": {"en": "Test Brand"},
            "contacts": contacts_data,
        }
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json=data_in,
            headers=headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["brand_name"]["en"] == "Test Brand"
        assert "contacts" in data
        assert isinstance(data["contacts"], list)
        assert len(data["contacts"]) == 2
        contact1 = data["contacts"][0]
        contact2 = data["contacts"][1]
        assert contact1["type"] == "manufacturer"
        assert contact1["name"] == "Test Manufacturer Co."
        assert contact1["email"] == "contact@manufacturer.com"
        assert contact2["type"] == "distributor"
        assert contact2["name"] == "Test Distributor Inc."
        assert contact2["email"] == "info@distributor.com"
        assert "website" in contact1
        assert "website" not in contact2 or contact2["website"] is None

    def test_create_label_data_already_exists(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating LabelData when it already exists returns 409."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data_in = {"brand_name": {"en": "Test Brand"}}
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json=data_in,
            headers=headers,
        )
        assert response.status_code == 409, (
            f"Expected 409, got {response.status_code}: {response.text}"
        )

    def test_create_label_data_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that creating LabelData requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        data_in = {"brand_name": {"en": "Test Brand"}}
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json=data_in,
        )
        assert response.status_code == 401

    def test_create_label_data_completed_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test creating LabelData for completed label returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product, completed=True)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data_in = {"brand_name": {"en": "Test Brand"}}
        response = client.post(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json=data_in,
            headers=headers,
        )
        assert response.status_code == 400
        assert "completed" in response.json()["detail"].lower()


@pytest.mark.usefixtures("override_dependencies")
class TestReadLabelData:
    """Tests for reading LabelData."""

    def test_read_label_data_basic(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading LabelData with basic fields."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(
            label=label,
            brand_name={"en": "Test Brand"},
            product_name={"en": "Test Product"},
            registration_number="1234567f",
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            headers=headers,
        )
        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}: {response.text}"
        )
        data = response.json()
        assert data["brand_name"]["en"] == "Test Brand"
        assert data["product_name"]["en"] == "Test Product"
        assert data["registration_number"] == "1234567F"
        assert "id" not in data

    def test_read_label_data_with_contacts_json_field(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading LabelData with contacts JSON field - verify proper conversion to Contact objects."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        contacts_data = [
            {
                "type": "manufacturer",
                "name": "Test Manufacturer Co.",
                "address": "123 Main St",
                "phone": "1-800-123-4567",
                "email": "contact@manufacturer.com",
                "website": "https://manufacturer.com",
            },
            {
                "type": "distributor",
                "name": "Test Distributor Inc.",
                "email": "info@distributor.com",
            },
        ]
        LabelDataFactory(
            label=label,
            brand_name={"en": "Test Brand"},
            contacts=contacts_data,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["brand_name"]["en"] == "Test Brand"
        assert "contacts" in data
        assert isinstance(data["contacts"], list)
        assert len(data["contacts"]) == 2
        contact1 = data["contacts"][0]
        contact2 = data["contacts"][1]
        assert isinstance(contact1, dict)
        assert isinstance(contact2, dict)
        assert contact1["type"] == "manufacturer"
        assert contact1["name"] == "Test Manufacturer Co."
        assert contact1["email"] == "contact@manufacturer.com"
        assert contact1["address"] == "123 Main St"
        assert contact1["phone"] == "1-800-123-4567"
        assert contact1["website"] == "https://manufacturer.com"
        assert contact2["type"] == "distributor"
        assert contact2["name"] == "Test Distributor Inc."
        assert contact2["email"] == "info@distributor.com"
        assert "address" not in contact2 or contact2["address"] is None
        assert "phone" not in contact2 or contact2["phone"] is None
        assert "website" not in contact2 or contact2["website"] is None
        try:
            Contact.model_validate(contact1)
            Contact.model_validate(contact2)
        except Exception as e:
            pytest.fail(f"Contact validation failed: {e}")

    def test_read_label_data_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test reading non-existent LabelData returns 404."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            headers=headers,
        )
        assert response.status_code == 404

    def test_read_label_data_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that reading LabelData requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        response = client.get(f"{settings.API_V1_STR}/labels/{label.id}/data")
        assert response.status_code == 401


@pytest.mark.usefixtures("override_dependencies")
class TestUpdateLabelData:
    """Tests for updating LabelData."""

    def test_update_label_data_partial(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test partial update of LabelData."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(
            label=label,
            brand_name={"en": "Original Brand"},
            product_name={"en": "Original Product"},
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"brand_name": {"en": "Updated Brand"}}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["brand_name"]["en"] == "Updated Brand"
        assert data["product_name"]["en"] == "Original Product"

    def test_update_label_data_with_contacts_json_field(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating LabelData contacts JSON field - verify proper conversion."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        original_contacts = [
            {
                "type": "manufacturer",
                "name": "Original Manufacturer",
                "email": "original@manufacturer.com",
            }
        ]
        LabelDataFactory(
            label=label,
            brand_name={"en": "Test Brand"},
            contacts=original_contacts,
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        new_contacts = [
            {
                "type": "distributor",
                "name": "New Distributor",
                "email": "new@distributor.com",
                "address": "456 New St",
            }
        ]
        update_data = {"contacts": new_contacts}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["brand_name"]["en"] == "Test Brand"
        assert "contacts" in data
        assert isinstance(data["contacts"], list)
        assert len(data["contacts"]) == 1
        contact = data["contacts"][0]
        assert isinstance(contact, dict)
        assert contact["type"] == "distributor"
        assert contact["name"] == "New Distributor"
        assert contact["email"] == "new@distributor.com"
        assert contact["address"] == "456 New St"
        try:
            Contact.model_validate(contact)
        except Exception as e:
            pytest.fail(f"Contact validation failed: {e}")

    def test_update_label_data_empty_update(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating LabelData with empty update data returns original."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(
            label=label,
            brand_name={"en": "Original Brand"},
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json={},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["brand_name"]["en"] == "Original Brand"

    def test_update_label_data_not_found(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating non-existent LabelData returns 404."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"brand_name": {"en": "Updated Brand"}}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 404

    def test_update_label_data_requires_authentication(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test that updating LabelData requires authentication."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product)
        LabelDataFactory(label=label)
        update_data = {"brand_name": {"en": "Updated Brand"}}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json=update_data,
        )
        assert response.status_code == 401

    def test_update_label_data_completed_label(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test updating LabelData for completed label returns 400."""
        user = UserFactory()
        product = ProductFactory(created_by=user)
        label = LabelFactory(created_by=user, product=product, completed=True)
        LabelDataFactory(
            label=label,
            brand_name={"en": "Original Brand"},
        )
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        update_data = {"brand_name": {"en": "Updated Brand"}}
        response = client.patch(
            f"{settings.API_V1_STR}/labels/{label.id}/data",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 400
        assert "completed" in response.json()["detail"].lower()
