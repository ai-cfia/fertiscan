"""Item controller tests."""

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.items import (
    create_item,
    delete_item,
    get_item_by_id,
    get_items,
    update_item,
)
from app.schemas.item import ItemCreate, ItemUpdate
from tests.utils.item import create_random_item
from tests.utils.user import create_random_user


class TestGetItems:
    async def test_returns_items_and_count(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        item1 = await create_random_item(db, owner=user)
        item2 = await create_random_item(db, owner=user)
        items, count = await get_items(db, owner_id=user.id, skip=0, limit=100)
        assert count >= 2
        assert len(items) >= 2
        item_ids = [item.id for item in items]
        assert item1.id in item_ids
        assert item2.id in item_ids

    async def test_pagination(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        await create_random_item(db, owner=user)
        await create_random_item(db, owner=user)
        items, count = await get_items(db, owner_id=user.id, skip=0, limit=1)
        assert count >= 2
        assert len(items) == 1


class TestGetItemById:
    async def test_returns_item_when_found(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        item = await create_random_item(db, owner=user)
        result = await get_item_by_id(db, item_id=item.id, owner_id=user.id)
        assert result is not None
        assert result.id == item.id
        assert result.title == item.title

    async def test_returns_none_when_not_found(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        result = await get_item_by_id(db, item_id=uuid4(), owner_id=user.id)
        assert result is None

    async def test_returns_none_for_other_user(self, db: AsyncSession) -> None:
        owner = await create_random_user(db)
        other_user = await create_random_user(db)
        item = await create_random_item(db, owner=owner)
        result = await get_item_by_id(db, item_id=item.id, owner_id=other_user.id)
        assert result is None


class TestCreateItem:
    async def test_creates_and_returns_item(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        item_in = ItemCreate(title="Test Item", description="Test description")
        item = await create_item(db, item_in=item_in, owner_id=user.id)
        assert item.id is not None
        assert item.title == "Test Item"
        assert item.description == "Test description"
        assert item.owner_id == user.id


class TestUpdateItem:
    async def test_updates_and_returns_item(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        item = await create_random_item(db, owner=user)
        item_in = ItemUpdate(title="Updated Title", description="Updated description")
        result = await update_item(
            db, item_id=item.id, owner_id=user.id, item_in=item_in
        )
        assert result is not None
        assert result.id == item.id
        assert result.title == "Updated Title"
        assert result.description == "Updated description"

    async def test_returns_none_when_not_found(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        item_in = ItemUpdate(title="Updated Title")
        result = await update_item(
            db, item_id=uuid4(), owner_id=user.id, item_in=item_in
        )
        assert result is None

    async def test_returns_none_for_other_user(self, db: AsyncSession) -> None:
        owner = await create_random_user(db)
        other_user = await create_random_user(db)
        item = await create_random_item(db, owner=owner)
        item_in = ItemUpdate(title="Updated Title")
        result = await update_item(
            db, item_id=item.id, owner_id=other_user.id, item_in=item_in
        )
        assert result is None


class TestDeleteItem:
    async def test_deletes_and_returns_true(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        item = await create_random_item(db, owner=user)
        result = await delete_item(db, item_id=item.id, owner_id=user.id)
        assert result is True
        deleted = await get_item_by_id(db, item_id=item.id, owner_id=user.id)
        assert deleted is None

    async def test_returns_false_when_not_found(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        result = await delete_item(db, item_id=uuid4(), owner_id=user.id)
        assert result is False

    async def test_returns_false_for_other_user(self, db: AsyncSession) -> None:
        owner = await create_random_user(db)
        other_user = await create_random_user(db)
        item = await create_random_item(db, owner=owner)
        result = await delete_item(db, item_id=item.id, owner_id=other_user.id)
        assert result is False
        still_exists = await get_item_by_id(db, item_id=item.id, owner_id=owner.id)
        assert still_exists is not None
