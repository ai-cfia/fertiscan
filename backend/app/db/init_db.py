"""Database initialization utilities."""

import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.controllers.product_types import (
    create_product_type,
    get_product_type_by_code,
)
from app.controllers.users import create_user, get_user_by_email
from app.schemas.product_type import ProductTypeCreate
from app.schemas.user import UserCreate

logger = logging.getLogger(__name__)


def init_db(session: Session) -> None:
    """Initialize database: create first superuser and product types."""
    # Create first superuser
    if user := get_user_by_email(session, settings.FIRST_SUPERUSER):
        logger.info(f"Superuser already exists: {user.email}")
    else:
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

    # Seed product types
    if product_type := get_product_type_by_code(session, "fertilizer"):
        logger.info(f"ProductType 'fertilizer' already exists: {product_type.code}")
    else:
        product_type_in = ProductTypeCreate(
            code="fertilizer",
            name_en="Fertilizer",
            name_fr="Engrais",
            is_active=True,
        )
        product_type = create_product_type(session, product_type_in)
        session.commit()
        logger.info(f"ProductType 'fertilizer' created: {product_type.code}")
