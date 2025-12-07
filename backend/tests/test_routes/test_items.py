"""Item route tests."""

from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from tests.utils.item import create_random_item
from tests.utils.user import authentication_token_from_email, create_random_user


async def test_create_item(client: TestClient, db: AsyncSession) -> None:
    """Test creating an item."""
    user = await create_random_user(db)
    await db.commit()
    headers = await authentication_token_from_email(
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


async def test_read_item(client: TestClient, db: AsyncSession) -> None:
    """Test reading an item."""
    user = await create_random_user(db)
    item = await create_random_item(db, owner=user)
    await db.commit()
    headers = await authentication_token_from_email(
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


async def test_read_item_not_found(client: TestClient, db: AsyncSession) -> None:
    """Test reading a non-existent item."""
    user = await create_random_user(db)
    await db.commit()
    headers = await authentication_token_from_email(
        client=client, email=user.email, db=db
    )
    fake_id = uuid4()
    response = client.get(
        f"{settings.API_V1_STR}/items/{fake_id}",
        headers=headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


async def test_read_item_other_user(client: TestClient, db: AsyncSession) -> None:
    """Test reading another user's item (should fail)."""
    owner = await create_random_user(db)
    other_user = await create_random_user(db)
    item = await create_random_item(db, owner=owner)
    await db.commit()
    headers = await authentication_token_from_email(
        client=client, email=other_user.email, db=db
    )
    response = client.get(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


async def test_read_items(client: TestClient, db: AsyncSession) -> None:
    """Test listing items."""
    user = await create_random_user(db)
    item1 = await create_random_item(db, owner=user)
    item2 = await create_random_item(db, owner=user)
    await db.commit()
    headers = await authentication_token_from_email(
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


async def test_read_items_pagination(client: TestClient, db: AsyncSession) -> None:
    """Test listing items with pagination."""
    user = await create_random_user(db)
    await create_random_item(db, owner=user)
    await create_random_item(db, owner=user)
    await db.commit()
    headers = await authentication_token_from_email(
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


async def test_read_items_only_own(client: TestClient, db: AsyncSession) -> None:
    """Test that users only see their own items."""
    user1 = await create_random_user(db)
    user2 = await create_random_user(db)
    item1 = await create_random_item(db, owner=user1)
    await create_random_item(db, owner=user2)
    await db.commit()
    headers = await authentication_token_from_email(
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


async def test_update_item(client: TestClient, db: AsyncSession) -> None:
    """Test updating an item."""
    user = await create_random_user(db)
    item = await create_random_item(db, owner=user)
    await db.commit()
    headers = await authentication_token_from_email(
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


async def test_update_item_not_found(client: TestClient, db: AsyncSession) -> None:
    """Test updating a non-existent item."""
    user = await create_random_user(db)
    await db.commit()
    headers = await authentication_token_from_email(
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


async def test_update_item_other_user(client: TestClient, db: AsyncSession) -> None:
    """Test updating another user's item (should fail)."""
    owner = await create_random_user(db)
    other_user = await create_random_user(db)
    item = await create_random_item(db, owner=owner)
    await db.commit()
    headers = await authentication_token_from_email(
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


async def test_delete_item(client: TestClient, db: AsyncSession) -> None:
    """Test deleting an item."""
    user = await create_random_user(db)
    item = await create_random_item(db, owner=user)
    await db.commit()
    headers = await authentication_token_from_email(
        client=client, email=user.email, db=db
    )
    response = client.delete(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Item deleted successfully"


async def test_delete_item_not_found(client: TestClient, db: AsyncSession) -> None:
    """Test deleting a non-existent item."""
    user = await create_random_user(db)
    await db.commit()
    headers = await authentication_token_from_email(
        client=client, email=user.email, db=db
    )
    fake_id = uuid4()
    response = client.delete(
        f"{settings.API_V1_STR}/items/{fake_id}",
        headers=headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


async def test_delete_item_other_user(client: TestClient, db: AsyncSession) -> None:
    """Test deleting another user's item (should fail)."""
    owner = await create_random_user(db)
    other_user = await create_random_user(db)
    item = await create_random_item(db, owner=owner)
    await db.commit()
    headers = await authentication_token_from_email(
        client=client, email=other_user.email, db=db
    )
    response = client.delete(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"
