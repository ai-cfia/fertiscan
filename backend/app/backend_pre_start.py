import logging

import boto3
from sqlalchemy import text
from tenacity import (
    after_log,
    before_log,
    before_sleep_log,
    retry,
    stop_after_attempt,
    wait_fixed,
)

from app.config import settings
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
def check_db() -> None:
    """Check database connectivity."""
    with get_engine().connect() as conn:
        conn.execute(text("SELECT 1"))


@retry(
    stop=stop_after_attempt(MAX_TRIES),
    wait=wait_fixed(WAIT_SECONDS),
    reraise=True,
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
    before_sleep=before_sleep_log(logger, logging.ERROR),
)
def check_storage() -> None:
    """Check storage connectivity."""
    s3_client = boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint_url,
        aws_access_key_id=settings.MINIO_ROOT_USER,
        aws_secret_access_key=settings.MINIO_ROOT_PASSWORD.get_secret_value(),
        region_name=settings.STORAGE_REGION,
    )
    s3_client.list_buckets()


def main() -> None:
    logger.info("Checking service connectivity")
    check_db()
    check_storage()
    logger.info("Service connectivity checks complete")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
