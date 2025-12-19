"""Item routes."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter

from app.controllers import items
from app.dependencies import CurrentUser, SessionDep
from app.exceptions import ItemNotFound
from app.schemas.item import ItemCreate, ItemPublic, ItemsPublic, ItemUpdate
from app.schemas.message import Message

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=ItemsPublic)
def read_items(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    item_list, count = items.get_items(session, current_user.id, skip=skip, limit=limit)
    return ItemsPublic(data=item_list, count=count)


@router.get("/{item_id}", response_model=ItemPublic)
def read_item(
    session: SessionDep,
    current_user: CurrentUser,
    item_id: UUID,
) -> Any:
    if not (item := items.get_item_by_id(session, item_id, current_user.id)):
        raise ItemNotFound()
    return item


@router.post("", response_model=ItemPublic, status_code=201)
def create_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    item_in: ItemCreate,
) -> Any:
    item = items.create_item(session, item_in, current_user.id)
    return item


@router.put("/{item_id}", response_model=ItemPublic)
def update_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    item_id: UUID,
    item_in: ItemUpdate,
) -> Any:
    if not (item := items.update_item(session, item_id, current_user.id, item_in)):
        raise ItemNotFound()
    return item


@router.delete("/{item_id}", response_model=Message)
def delete_item(
    session: SessionDep,
    current_user: CurrentUser,
    item_id: UUID,
) -> Message:
    if not items.delete_item(session, item_id, current_user.id):
        raise ItemNotFound()
    return Message(message="Item deleted successfully")
