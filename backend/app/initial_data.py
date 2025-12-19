"""Initialize database with initial data."""

import logging

from sqlalchemy.orm import Session

from app.db.init_db import init_db
from app.db.session import get_sessionmaker

logger = logging.getLogger(__name__)


def run(session: Session | None = None) -> None:
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
