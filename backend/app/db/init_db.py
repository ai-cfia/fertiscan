"""Database initialization utilities."""

import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.controllers.users import create_user, get_user_by_email
from app.schemas.user import UserCreate

logger = logging.getLogger(__name__)


def init_db(session: Session) -> None:
    """Initialize database: create first superuser."""
    if user := get_user_by_email(session, settings.FIRST_SUPERUSER):
        logger.info(f"Superuser already exists: {user.email}")
        return
    user_in = UserCreate(
        email=settings.FIRST_SUPERUSER,
        password=settings.FIRST_SUPERUSER_PASSWORD,
        is_superuser=True,
        first_name="Admin",
        last_name="User",
    )
    user = create_user(session, user_in)
    session.commit()
    logger.info(f"Superuser created: {user.email}")
