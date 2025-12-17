"""Database initialization tests."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.controllers.users import get_user_by_email
from app.db.init_db import init_db


class TestInitDb:
    async def test_creates_superuser(self, db: AsyncSession) -> None:
        await init_db(db)
        user = await get_user_by_email(db, settings.FIRST_SUPERUSER)
        assert user is not None
        assert user.email == settings.FIRST_SUPERUSER
        assert user.is_superuser is True
        assert user.first_name == "Admin"
        assert user.last_name == "User"

    async def test_skips_when_superuser_exists(self, db: AsyncSession) -> None:
        await init_db(db)
        user1 = await get_user_by_email(db, settings.FIRST_SUPERUSER)
        assert user1 is not None
        initial_id = user1.id
        await init_db(db)
        user2 = await get_user_by_email(db, settings.FIRST_SUPERUSER)
        assert user2 is not None
        assert user2.id == initial_id
