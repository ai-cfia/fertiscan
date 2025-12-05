"""Item routes."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.controllers import items as i
from app.dependencies import AsyncSessionDep, CurrentUser
from app.schemas.item import ItemCreate, ItemPublic, ItemsPublic, ItemUpdate
from app.schemas.message import Message

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=ItemsPublic)
async def read_items(
    session: AsyncSessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    item_list, count = await i.get_items(
        session, current_user.id, skip=skip, limit=limit
    )
    return ItemsPublic(data=item_list, count=count)


@router.get("/{item_id}", response_model=ItemPublic)
async def read_item(
    session: AsyncSessionDep,
    current_user: CurrentUser,
    item_id: UUID,
) -> Any:
    if not (item := await i.get_item_by_id(session, item_id, current_user.id)):
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("", response_model=ItemPublic, status_code=201)
async def create_item(
    *,
    session: AsyncSessionDep,
    current_user: CurrentUser,
    item_in: ItemCreate,
) -> Any:
    item = await i.create_item(session, item_in, current_user.id)
    return item


@router.put("/{item_id}", response_model=ItemPublic)
async def update_item(
    *,
    session: AsyncSessionDep,
    current_user: CurrentUser,
    item_id: UUID,
    item_in: ItemUpdate,
) -> Any:
    if not (item := await i.update_item(session, item_id, current_user.id, item_in)):
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/{item_id}", response_model=Message)
async def delete_item(
    session: AsyncSessionDep,
    current_user: CurrentUser,
    item_id: UUID,
) -> Message:
    if not await i.delete_item(session, item_id, current_user.id):
        raise HTTPException(status_code=404, detail="Item not found")
    return Message(message="Item deleted successfully")
