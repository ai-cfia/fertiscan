"""Storage initialization utilities."""

import logging

import boto3
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)


def init_storage() -> None:
    """Initialize storage: create bucket if missing."""
    s3_client = boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint_url,
        aws_access_key_id=settings.MINIO_ROOT_USER,
        aws_secret_access_key=settings.MINIO_ROOT_PASSWORD.get_secret_value(),
        region_name=settings.STORAGE_REGION,
    )
    try:
        s3_client.head_bucket(Bucket=settings.STORAGE_BUCKET_NAME)
        logger.info(f"Bucket exists: {settings.STORAGE_BUCKET_NAME}")
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code in ("404", "NoSuchBucket"):
            s3_client.create_bucket(Bucket=settings.STORAGE_BUCKET_NAME)
            logger.info(f"Created bucket: {settings.STORAGE_BUCKET_NAME}")
        else:
            raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Initializing storage")
    init_storage()
    logger.info("Storage initialized")
