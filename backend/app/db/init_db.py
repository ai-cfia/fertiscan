"""Database initialization utilities."""

import json
import logging
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.controllers.product_types import (
    create_product_type,
    get_product_type_by_code,
)
from app.controllers.users import create_user, get_user_by_email
from app.db.models.rule import Rule
from app.db.session import get_sessionmaker
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

    # Seed rule

    rule_data = settings.rule_data_seed()
    if len(rule_data) == 0:
        logger.warning(f"Rule seed file not found: {settings.RULE_SEED_DATA_PATH}")

    rules_added = False
    for rule_draft in rule_data:
        if (
            rule := session.query(Rule)
            .filter_by(reference_number=rule_draft["reference_number"])
            .first()
        ):
            logger.info(f"This rule already exists: {rule.reference_number}")
        else:
            rule = Rule(**rule_draft)
            session.add(rule)
            logger.info(f"Rule created: {rule.reference_number}")
            rules_added = True
    if rules_added:
        session.commit()


def run(session: Session | None = None) -> None:
    """Run database initialization with optional session."""
    logger.info("Initializing database")
    if session:
        init_db(session)
    else:
        with get_sessionmaker()() as s:
            init_db(s)
    logger.info("Database initialized")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
