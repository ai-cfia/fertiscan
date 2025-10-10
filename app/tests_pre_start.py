import asyncio
import logging

from sqlalchemy import text
from tenacity import (
    after_log,
    before_log,
    before_sleep_log,
    retry,
    stop_after_attempt,
    wait_fixed,
)

from app.db.session import engine

logger = logging.getLogger(__name__)
MAX_TRIES = 60 * 5
WAIT_SECONDS = 1


@retry(
    stop=stop_after_attempt(MAX_TRIES),
    wait=wait_fixed(WAIT_SECONDS),
    reraise=True,
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
    before_sleep=before_sleep_log(logger, logging.ERROR),
)
async def init() -> None:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))


async def main() -> None:
    logger.info("Initializing test service")
    await init()
    logger.info("Test service finished initializing")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
