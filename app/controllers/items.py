"""Item CRUD operations using SQLAlchemy ORM."""

from uuid import UUID

from pydantic import validate_call
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate


@validate_call(config={"arbitrary_types_allowed": True})
async def get_items(
    session: AsyncSession,
    owner_id: UUID,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Item], int]:
    """Get all items for a specific owner with pagination."""
    count_stmt = select(func.count()).select_from(Item).where(Item.owner_id == owner_id)
    count_result = await session.execute(count_stmt)
    count = count_result.scalar_one()
    stmt = select(Item).where(Item.owner_id == owner_id).offset(skip).limit(limit)
    result = await session.execute(stmt)
    items = list(result.scalars().all())
    return items, count


@validate_call(config={"arbitrary_types_allowed": True})
async def get_item_by_id(
    session: AsyncSession, item_id: UUID, owner_id: UUID
) -> Item | None:
    """Get item by ID if owned by user."""
    stmt = select(Item).where(Item.id == item_id, Item.owner_id == owner_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


@validate_call(config={"arbitrary_types_allowed": True})
async def create_item(
    session: AsyncSession, item_in: ItemCreate, owner_id: UUID
) -> Item:
    """Create new item."""
    item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(item)
    await session.flush()
    await session.refresh(item)
    return item


@validate_call(config={"arbitrary_types_allowed": True})
async def update_item(
    session: AsyncSession,
    item_id: UUID,
    owner_id: UUID,
    item_in: ItemUpdate,
) -> Item | None:
    """Update an item if owned by user."""
    stmt = select(Item).where(Item.id == item_id, Item.owner_id == owner_id)
    result = await session.execute(stmt)
    if not (item := result.scalar_one_or_none()):
        return None
    update_data = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_data)
    session.add(item)
    await session.flush()
    await session.refresh(item)
    return item


@validate_call(config={"arbitrary_types_allowed": True})
async def delete_item(session: AsyncSession, item_id: UUID, owner_id: UUID) -> bool:
    """Delete an item if owned by user. Returns True if deleted, False if not found."""
    stmt = select(Item).where(Item.id == item_id, Item.owner_id == owner_id)
    result = await session.execute(stmt)
    if not (item := result.scalar_one_or_none()):
        return False
    await session.delete(item)
    await session.flush()
    return True
