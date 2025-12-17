"""Item test utilities."""

from sqlalchemy.orm import Session

from app.controllers.items import create_item
from app.db.models.item import Item
from app.db.models.user import User
from app.schemas.item import ItemCreate
from tests.utils.utils import random_lower_string


def create_random_item(db: Session, owner: User | None = None) -> Item:
    """Create a random item."""
    if owner is None:
        from tests.utils.user import create_random_user

        owner = create_random_user(db)
    item_in = ItemCreate(
        title=random_lower_string(),
        description=random_lower_string(),
    )
    return create_item(db, item_in, owner.id)
