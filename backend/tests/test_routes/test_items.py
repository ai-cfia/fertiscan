"""Item route tests."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from tests.utils.item import create_random_item
from tests.utils.user import authentication_token_from_email, create_random_user


@pytest.mark.usefixtures("override_dependencies")
class TestCreateItem:
    """Tests for creating items."""

    def test_create_item(self, client: TestClient, db: Session) -> None:
        """Test creating an item."""
        user = create_random_user(db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {"title": "Test Item", "description": "Test description"}
        response = client.post(
            f"{settings.API_V1_STR}/items",
            headers=headers,
            json=data,
        )
        assert response.status_code == 201
        content = response.json()
        assert content["title"] == data["title"]
        assert content["description"] == data["description"]
        assert "id" in content
        assert content["owner_id"] == str(user.id)


@pytest.mark.usefixtures("override_dependencies")
class TestReadItem:
    """Tests for reading items."""

    def test_read_item(self, client: TestClient, db: Session) -> None:
        """Test reading an item."""
        user = create_random_user(db)
        item = create_random_item(db, owner=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/items/{item.id}",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["id"] == str(item.id)
        assert content["title"] == item.title
        assert content["owner_id"] == str(user.id)

    def test_read_item_not_found(self, client: TestClient, db: Session) -> None:
        """Test reading a non-existent item."""
        user = create_random_user(db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        fake_id = uuid4()
        response = client.get(
            f"{settings.API_V1_STR}/items/{fake_id}",
            headers=headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Item not found"

    def test_read_item_other_user(self, client: TestClient, db: Session) -> None:
        """Test reading another user's item (should fail)."""
        owner = create_random_user(db)
        other_user = create_random_user(db)
        item = create_random_item(db, owner=owner)
        headers = authentication_token_from_email(
            client=client, email=other_user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/items/{item.id}",
            headers=headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Item not found"


@pytest.mark.usefixtures("override_dependencies")
class TestReadItems:
    """Tests for listing items."""

    def test_read_items(self, client: TestClient, db: Session) -> None:
        """Test listing items."""
        user = create_random_user(db)
        item1 = create_random_item(db, owner=user)
        item2 = create_random_item(db, owner=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/items",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["count"] >= 2
        assert len(content["data"]) >= 2
        item_ids = [item["id"] for item in content["data"]]
        assert str(item1.id) in item_ids
        assert str(item2.id) in item_ids

    def test_read_items_pagination(self, client: TestClient, db: Session) -> None:
        """Test listing items with pagination."""
        user = create_random_user(db)
        create_random_item(db, owner=user)
        create_random_item(db, owner=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/items?skip=0&limit=1",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["count"] >= 2
        assert len(content["data"]) == 1

    def test_read_items_only_own(self, client: TestClient, db: Session) -> None:
        """Test that users only see their own items."""
        user1 = create_random_user(db)
        user2 = create_random_user(db)
        item1 = create_random_item(db, owner=user1)
        create_random_item(db, owner=user2)
        headers = authentication_token_from_email(
            client=client, email=user1.email, db=db
        )
        response = client.get(
            f"{settings.API_V1_STR}/items",
            headers=headers,
        )
        assert response.status_code == 200
        content = response.json()
        item_ids = [item["id"] for item in content["data"]]
        assert str(item1.id) in item_ids
        assert all(item["owner_id"] == str(user1.id) for item in content["data"])


@pytest.mark.usefixtures("override_dependencies")
class TestUpdateItem:
    """Tests for updating items."""

    def test_update_item(self, client: TestClient, db: Session) -> None:
        """Test updating an item."""
        user = create_random_user(db)
        item = create_random_item(db, owner=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        data = {"title": "Updated Title", "description": "Updated description"}
        response = client.put(
            f"{settings.API_V1_STR}/items/{item.id}",
            headers=headers,
            json=data,
        )
        assert response.status_code == 200
        content = response.json()
        assert content["title"] == data["title"]
        assert content["description"] == data["description"]

    def test_update_item_not_found(self, client: TestClient, db: Session) -> None:
        """Test updating a non-existent item."""
        user = create_random_user(db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        fake_id = uuid4()
        data = {"title": "Updated Title"}
        response = client.put(
            f"{settings.API_V1_STR}/items/{fake_id}",
            headers=headers,
            json=data,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Item not found"

    def test_update_item_other_user(self, client: TestClient, db: Session) -> None:
        """Test updating another user's item (should fail)."""
        owner = create_random_user(db)
        other_user = create_random_user(db)
        item = create_random_item(db, owner=owner)
        headers = authentication_token_from_email(
            client=client, email=other_user.email, db=db
        )
        data = {"title": "Updated Title"}
        response = client.put(
            f"{settings.API_V1_STR}/items/{item.id}",
            headers=headers,
            json=data,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Item not found"


@pytest.mark.usefixtures("override_dependencies")
class TestDeleteItem:
    """Tests for deleting items."""

    def test_delete_item(self, client: TestClient, db: Session) -> None:
        """Test deleting an item."""
        user = create_random_user(db)
        item = create_random_item(db, owner=user)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        response = client.delete(
            f"{settings.API_V1_STR}/items/{item.id}",
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Item deleted successfully"

    def test_delete_item_not_found(self, client: TestClient, db: Session) -> None:
        """Test deleting a non-existent item."""
        user = create_random_user(db)
        headers = authentication_token_from_email(
            client=client, email=user.email, db=db
        )
        fake_id = uuid4()
        response = client.delete(
            f"{settings.API_V1_STR}/items/{fake_id}",
            headers=headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Item not found"

    def test_delete_item_other_user(self, client: TestClient, db: Session) -> None:
        """Test deleting another user's item (should fail)."""
        owner = create_random_user(db)
        other_user = create_random_user(db)
        item = create_random_item(db, owner=owner)
        headers = authentication_token_from_email(
            client=client, email=other_user.email, db=db
        )
        response = client.delete(
            f"{settings.API_V1_STR}/items/{item.id}",
            headers=headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Item not found"
