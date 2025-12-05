"""Database initialization tests."""

from app.config import settings
from app.controllers.users import get_user_by_email
from app.db.init_db import init_db
from tests.conftest import test_sessionmaker


async def test_init_db_creates_superuser() -> None:
    """Test init_db creates superuser when it doesn't exist."""
    async with test_sessionmaker() as session:
        await init_db(session)
        await session.commit()
        user = await get_user_by_email(session, settings.FIRST_SUPERUSER)
        assert user is not None
        assert user.email == settings.FIRST_SUPERUSER
        assert user.is_superuser is True
        assert user.first_name == "Admin"
        assert user.last_name == "User"


async def test_init_db_skips_when_superuser_exists() -> None:
    """Test init_db skips creation when superuser already exists."""
    async with test_sessionmaker() as session:
        await init_db(session)
        await session.commit()
        user1 = await get_user_by_email(session, settings.FIRST_SUPERUSER)
        assert user1 is not None
        initial_id = user1.id
        await init_db(session)
        await session.commit()
        user2 = await get_user_by_email(session, settings.FIRST_SUPERUSER)
        assert user2 is not None
        assert user2.id == initial_id
