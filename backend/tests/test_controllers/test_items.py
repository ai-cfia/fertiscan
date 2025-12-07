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


async def test_get_items(db: AsyncSession) -> None:
    """Test get_items returns items and count."""
    user = await create_random_user(db)
    item1 = await create_random_item(db, owner=user)
    item2 = await create_random_item(db, owner=user)
    await db.commit()
    items, count = await get_items(db, owner_id=user.id, skip=0, limit=100)
    assert count >= 2
    assert len(items) >= 2
    item_ids = [item.id for item in items]
    assert item1.id in item_ids
    assert item2.id in item_ids


async def test_get_items_pagination(db: AsyncSession) -> None:
    """Test get_items with pagination."""
    user = await create_random_user(db)
    await create_random_item(db, owner=user)
    await create_random_item(db, owner=user)
    await db.commit()
    items, count = await get_items(db, owner_id=user.id, skip=0, limit=1)
    assert count >= 2
    assert len(items) == 1


async def test_get_item_by_id(db: AsyncSession) -> None:
    """Test get_item_by_id returns item when found."""
    user = await create_random_user(db)
    item = await create_random_item(db, owner=user)
    await db.commit()
    result = await get_item_by_id(db, item_id=item.id, owner_id=user.id)
    assert result is not None
    assert result.id == item.id
    assert result.title == item.title


async def test_get_item_by_id_not_found(db: AsyncSession) -> None:
    """Test get_item_by_id returns None when not found."""
    user = await create_random_user(db)
    await db.commit()
    fake_id = uuid4()
    result = await get_item_by_id(db, item_id=fake_id, owner_id=user.id)
    assert result is None


async def test_get_item_by_id_other_user(db: AsyncSession) -> None:
    """Test get_item_by_id returns None for other user's item."""
    owner = await create_random_user(db)
    other_user = await create_random_user(db)
    item = await create_random_item(db, owner=owner)
    await db.commit()
    result = await get_item_by_id(db, item_id=item.id, owner_id=other_user.id)
    assert result is None


async def test_create_item(db: AsyncSession) -> None:
    """Test create_item creates and returns item."""
    user = await create_random_user(db)
    await db.commit()
    item_in = ItemCreate(title="Test Item", description="Test description")
    item = await create_item(db, item_in=item_in, owner_id=user.id)
    await db.commit()
    assert item.id is not None
    assert item.title == "Test Item"
    assert item.description == "Test description"
    assert item.owner_id == user.id


async def test_update_item(db: AsyncSession) -> None:
    """Test update_item updates and returns item."""
    user = await create_random_user(db)
    item = await create_random_item(db, owner=user)
    await db.commit()
    item_in = ItemUpdate(title="Updated Title", description="Updated description")
    result = await update_item(db, item_id=item.id, owner_id=user.id, item_in=item_in)
    await db.commit()
    assert result is not None
    assert result.id == item.id
    assert result.title == "Updated Title"
    assert result.description == "Updated description"


async def test_update_item_not_found(db: AsyncSession) -> None:
    """Test update_item returns None when item not found."""
    user = await create_random_user(db)
    await db.commit()
    fake_id = uuid4()
    item_in = ItemUpdate(title="Updated Title")
    result = await update_item(db, item_id=fake_id, owner_id=user.id, item_in=item_in)
    assert result is None


async def test_update_item_other_user(db: AsyncSession) -> None:
    """Test update_item returns None for other user's item."""
    owner = await create_random_user(db)
    other_user = await create_random_user(db)
    item = await create_random_item(db, owner=owner)
    await db.commit()
    item_in = ItemUpdate(title="Updated Title")
    result = await update_item(
        db, item_id=item.id, owner_id=other_user.id, item_in=item_in
    )
    assert result is None


async def test_delete_item(db: AsyncSession) -> None:
    """Test delete_item deletes and returns True."""
    user = await create_random_user(db)
    item = await create_random_item(db, owner=user)
    await db.commit()
    result = await delete_item(db, item_id=item.id, owner_id=user.id)
    await db.commit()
    assert result is True
    deleted = await get_item_by_id(db, item_id=item.id, owner_id=user.id)
    assert deleted is None


async def test_delete_item_not_found(db: AsyncSession) -> None:
    """Test delete_item returns False when item not found."""
    user = await create_random_user(db)
    await db.commit()
    fake_id = uuid4()
    result = await delete_item(db, item_id=fake_id, owner_id=user.id)
    assert result is False


async def test_delete_item_other_user(db: AsyncSession) -> None:
    """Test delete_item returns False for other user's item."""
    owner = await create_random_user(db)
    other_user = await create_random_user(db)
    item = await create_random_item(db, owner=owner)
    await db.commit()
    result = await delete_item(db, item_id=item.id, owner_id=other_user.id)
    assert result is False
    still_exists = await get_item_by_id(db, item_id=item.id, owner_id=owner.id)
    assert still_exists is not None
