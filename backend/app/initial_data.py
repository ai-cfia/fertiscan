"""Initialize database with initial data."""

import asyncio
import logging

from app.db.init_db import init_db
from app.db.session import get_sessionmaker

logger = logging.getLogger(__name__)


async def main() -> None:
    logger.info("Initializing database")
    async with get_sessionmaker()() as session:
        await init_db(session)
    logger.info("Database initialized")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
