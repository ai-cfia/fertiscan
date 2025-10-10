"""Initialize database with initial data."""

import asyncio
import logging

from app.db.base import create_db_and_tables
from app.db.init_db import init_db
from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)


async def main() -> None:
    logger.info("Creating database tables")
    await create_db_and_tables()
    logger.info("Database tables created")
    logger.info("Creating initial data")
    async with AsyncSessionLocal() as session:
        await init_db(session)
    logger.info("Initial data created")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
