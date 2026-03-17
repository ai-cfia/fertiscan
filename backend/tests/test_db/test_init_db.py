"""Database initialization tests."""

from sqlmodel import Session, select

from app.config import settings
from app.db.init_db import init_db
from app.db.models.user import User


class TestInitDb:
    def test_creates_superuser(self, db: Session) -> None:
        init_db(db)
        user = db.exec(
            select(User).where(User.email == settings.FIRST_SUPERUSER)
        ).first()
        assert user is not None
        assert user.email == settings.FIRST_SUPERUSER
        assert user.is_superuser is True
        assert user.first_name == "Admin"
        assert user.last_name == "User"

    def test_skips_when_superuser_exists(self, db: Session) -> None:
        init_db(db)
        user1 = db.exec(
            select(User).where(User.email == settings.FIRST_SUPERUSER)
        ).first()
        assert user1 is not None
        initial_id = user1.id
        init_db(db)
        user2 = db.exec(
            select(User).where(User.email == settings.FIRST_SUPERUSER)
        ).first()
        assert user2 is not None
        assert user2.id == initial_id
