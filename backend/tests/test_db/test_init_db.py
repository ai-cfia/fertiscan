"""Database initialization tests."""

from sqlalchemy.orm import Session

from app.config import settings
from app.controllers.users import get_user_by_email
from app.db.init_db import init_db


class TestInitDb:
    def test_creates_superuser(self, db: Session) -> None:
        init_db(db)
        user = get_user_by_email(db, settings.FIRST_SUPERUSER)
        assert user is not None
        assert user.email == settings.FIRST_SUPERUSER
        assert user.is_superuser is True
        assert user.first_name == "Admin"
        assert user.last_name == "User"

    def test_skips_when_superuser_exists(self, db: Session) -> None:
        init_db(db)
        user1 = get_user_by_email(db, settings.FIRST_SUPERUSER)
        assert user1 is not None
        initial_id = user1.id
        init_db(db)
        user2 = get_user_by_email(db, settings.FIRST_SUPERUSER)
        assert user2 is not None
        assert user2.id == initial_id
