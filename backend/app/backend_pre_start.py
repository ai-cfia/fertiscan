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

from app.db.session import get_engine

logger = logging.getLogger(__name__)
MAX_TRIES = 60
WAIT_SECONDS = 1


@retry(
    stop=stop_after_attempt(MAX_TRIES),
    wait=wait_fixed(WAIT_SECONDS),
    reraise=True,
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
    before_sleep=before_sleep_log(logger, logging.ERROR),
)
def init() -> None:
    with get_engine().connect() as conn:
        conn.execute(text("SELECT 1"))


def main() -> None:
    logger.info("Initializing service")
    init()
    logger.info("Service finished initializing")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
