"""Presigned URL generation for S3-compatible storage."""

import logging
from datetime import UTC, datetime, timedelta
from typing import Any, cast
from uuid import UUID

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from botocore.exceptions import ClientError
from pydantic import validate_call
from sqlmodel import SQLModel

from app.config import settings
from app.storage.paths import build_storage_path

logger = logging.getLogger(__name__)


class PresignedUrl(SQLModel):
    """Presigned URL with expiration timestamp."""

    url: str
    expires_at: datetime


@validate_call(config={"arbitrary_types_allowed": True})
async def generate_presigned_upload_url(
    client: AioBaseClient,
    label_id: UUID,
    storage_filename: str,
    content_type: str,
    file_size: int | None = None,
    expiry_minutes: int = settings.PRESIGNED_UPLOAD_URL_EXPIRY_MINUTES,
) -> PresignedUrl:
    """Generate presigned PUT URL for file upload."""
    key = build_storage_path(label_id, storage_filename)
    params: dict[str, Any] = {
        "Bucket": settings.STORAGE_BUCKET_NAME,
        "Key": key,
        "ContentType": content_type,
    }
    if file_size is not None:
        params["ContentLength"] = file_size
    try:
        url = await client.generate_presigned_url(
            ClientMethod="put_object",
            Params=params,
            ExpiresIn=int(timedelta(minutes=expiry_minutes).total_seconds()),
        )
        expires_at = datetime.now(UTC) + timedelta(minutes=expiry_minutes)
        logger.debug(f"Generated presigned upload URL for {key}")
        return PresignedUrl(url=cast(str, url), expires_at=expires_at)
    except ClientError as e:
        logger.error(f"Failed to generate presigned upload URL for {key}: {e}")
        raise


@validate_call(config={"arbitrary_types_allowed": True})
async def generate_presigned_download_url(
    client: AioBaseClient,
    file_path: str,
    expiry_minutes: int = settings.PRESIGNED_DOWNLOAD_URL_EXPIRY_MINUTES,
) -> PresignedUrl:
    """Generate presigned GET URL for file download."""
    params: dict[str, Any] = {"Bucket": settings.STORAGE_BUCKET_NAME, "Key": file_path}
    try:
        url = await client.generate_presigned_url(
            ClientMethod="get_object",
            Params=params,
            ExpiresIn=int(timedelta(minutes=expiry_minutes).total_seconds()),
        )
        expires_at = datetime.now(UTC) + timedelta(minutes=expiry_minutes)
        logger.debug(f"Generated presigned download URL for {file_path}")
        return PresignedUrl(url=cast(str, url), expires_at=expires_at)
    except ClientError as e:
        logger.error(f"Failed to generate presigned download URL for {file_path}: {e}")
        raise
