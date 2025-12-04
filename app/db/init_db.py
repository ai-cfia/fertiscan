"""Database initialization utilities."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.controllers.users import create_user, get_user_by_email
from app.db.base import metadata
from app.schemas.user import UserCreate

logger = logging.getLogger(__name__)


async def init_db(session: AsyncSession) -> None:
    """Initialize database: create tables and first superuser."""
    import app.db.models.item  # noqa: F401 - Import registers model with metadata
    import app.db.models.user  # noqa: F401 - Import registers model with metadata

    # TEMPORARY: Create tables until Alembic is configured
    await session.run_sync(
        lambda sync_session: metadata.create_all(sync_session.get_bind())
    )

    # Initialize superuser
    if user := await get_user_by_email(session, settings.FIRST_SUPERUSER):
        logger.info(f"Superuser already exists: {user.email}")
        return
    user_in = UserCreate(
        email=settings.FIRST_SUPERUSER,
        password=settings.FIRST_SUPERUSER_PASSWORD,
        is_superuser=True,
        first_name="Admin",
        last_name="User",
    )
    user = await create_user(session, user_in)
    await session.commit()
    logger.info(f"Superuser created: {user.email}")
