"""Item controller tests."""

from uuid import uuid4

from sqlalchemy.orm import Session

from app.controllers.items import (
    create_item,
    delete_item,
    get_item_by_id,
    get_items,
    update_item,
)
from app.schemas.item import ItemCreate, ItemUpdate
from tests.factories.item import ItemFactory
from tests.factories.user import UserFactory


class TestGetItems:
    def test_returns_items_and_count(self, db: Session) -> None:
        user = UserFactory()
        item1 = ItemFactory(owner=user)
        item2 = ItemFactory(owner=user)
        items, count = get_items(db, owner_id=user.id, skip=0, limit=100)
        assert count >= 2
        assert len(items) >= 2
        item_ids = [item.id for item in items]
        assert item1.id in item_ids
        assert item2.id in item_ids

    def test_pagination(self, db: Session) -> None:
        user = UserFactory()
        ItemFactory(owner=user)
        ItemFactory(owner=user)
        items, count = get_items(db, owner_id=user.id, skip=0, limit=1)
        assert count >= 2
        assert len(items) == 1


class TestGetItemById:
    def test_returns_item_when_found(self, db: Session) -> None:
        user = UserFactory()
        item = ItemFactory(owner=user)
        result = get_item_by_id(db, item_id=item.id, owner_id=user.id)
        assert result is not None
        assert result.id == item.id
        assert result.title == item.title

    def test_returns_none_when_not_found(self, db: Session) -> None:
        user = UserFactory()
        result = get_item_by_id(db, item_id=uuid4(), owner_id=user.id)
        assert result is None

    def test_returns_none_for_other_user(self, db: Session) -> None:
        owner = UserFactory()
        other_user = UserFactory()
        item = ItemFactory(owner=owner)
        result = get_item_by_id(db, item_id=item.id, owner_id=other_user.id)
        assert result is None


class TestCreateItem:
    def test_creates_and_returns_item(self, db: Session) -> None:
        user = UserFactory()
        item_in = ItemCreate(title="Test Item", description="Test description")
        item = create_item(db, item_in=item_in, owner_id=user.id)
        assert item.id is not None
        assert item.title == "Test Item"
        assert item.description == "Test description"
        assert item.owner_id == user.id


class TestUpdateItem:
    def test_updates_and_returns_item(self, db: Session) -> None:
        user = UserFactory()
        item = ItemFactory(owner=user)
        item_in = ItemUpdate(title="Updated Title", description="Updated description")
        result = update_item(db, item_id=item.id, owner_id=user.id, item_in=item_in)
        assert result is not None
        assert result.id == item.id
        assert result.title == "Updated Title"
        assert result.description == "Updated description"

    def test_returns_none_when_not_found(self, db: Session) -> None:
        user = UserFactory()
        item_in = ItemUpdate(title="Updated Title")
        result = update_item(db, item_id=uuid4(), owner_id=user.id, item_in=item_in)
        assert result is None

    def test_returns_none_for_other_user(self, db: Session) -> None:
        owner = UserFactory()
        other_user = UserFactory()
        item = ItemFactory(owner=owner)
        item_in = ItemUpdate(title="Updated Title")
        result = update_item(
            db, item_id=item.id, owner_id=other_user.id, item_in=item_in
        )
        assert result is None


class TestDeleteItem:
    def test_deletes_and_returns_true(self, db: Session) -> None:
        user = UserFactory()
        item = ItemFactory(owner=user)
        result = delete_item(db, item_id=item.id, owner_id=user.id)
        assert result is True
        deleted = get_item_by_id(db, item_id=item.id, owner_id=user.id)
        assert deleted is None

    def test_returns_false_when_not_found(self, db: Session) -> None:
        user = UserFactory()
        result = delete_item(db, item_id=uuid4(), owner_id=user.id)
        assert result is False

    def test_returns_false_for_other_user(self, db: Session) -> None:
        owner = UserFactory()
        other_user = UserFactory()
        item = ItemFactory(owner=owner)
        result = delete_item(db, item_id=item.id, owner_id=other_user.id)
        assert result is False
        still_exists = get_item_by_id(db, item_id=item.id, owner_id=owner.id)
        assert still_exists is not None
