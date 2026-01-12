"""Storage operations for S3-compatible storage."""

import asyncio
import logging

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from botocore.exceptions import ClientError
from pydantic import validate_call

from app.config import settings

logger = logging.getLogger(__name__)


@validate_call(config={"arbitrary_types_allowed": True})
async def file_exists(
    client: AioBaseClient,
    file_path: str,
) -> bool:
    """Check if file exists in storage using file_path."""
    try:
        await client.head_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=file_path,
        )
        return True
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code in ("NoSuchKey", "404"):
            return False
        logger.error(f"Failed to check file existence in storage {file_path}: {e}")
        raise


@validate_call(config={"arbitrary_types_allowed": True})
async def delete_file(
    client: AioBaseClient,
    file_path: str,
) -> None:
    """Delete file from storage using file_path."""
    try:
        await client.delete_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=file_path,
        )
        logger.debug(f"Deleted file from storage: {file_path}")
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code in ("NoSuchKey", "404"):
            logger.warning(f"File not found in storage (already deleted?): {file_path}")
            return
        logger.error(f"Failed to delete file from storage {file_path}: {e}")
        raise


@validate_call(config={"arbitrary_types_allowed": True})
async def delete_files(
    client: AioBaseClient,
    file_paths: list[str],
) -> None:
    """Delete multiple files from storage in parallel."""
    if not file_paths:
        return
    tasks = [delete_file(client, file_path) for file_path in file_paths]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for file_path, result in zip(file_paths, results, strict=True):
        if isinstance(result, Exception):
            logger.warning(
                f"Failed to delete file {file_path} during batch deletion: {result}"
            )
