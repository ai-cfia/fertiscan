"""Database initialization utilities."""

import logging

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
    # TODO: Consider moving this to a separate seeding script if we have more rules to add in the future
    if rule := session.query(Rule).filter_by(reference_number="FzR: 16.(1)(j)").first():
        logger.info(f"Rule 'FzR: 16.(1)(j)' already exists: {rule.reference_number}")
    else:
        rule = Rule(
            reference_number="FzR: 16.(1)(j)",
            title_en="Lot number",
            title_fr="Numéro de lot",
            description_en="The lot number must be clearly visible on the fertilizer or supplement packaging.",
            description_fr="Le numéro de lot doit être clairement visible sur l'emballage de l'engrais ou du supplément.",
            url_en="https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._666/index.html",
            url_fr="https://laws-lois.justice.gc.ca/fra/reglements/C.R.C.%2C_ch._666/index.html",
        )
        session.add(rule)
        session.commit()
        logger.info(f"Rule 'FzR: 16.(1)(j)' created: {rule.reference_number}")


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
