from collections.abc import AsyncGenerator
from functools import lru_cache

from aioboto3 import Session  # type: ignore[import-untyped]
from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from botocore.config import Config

from app.config import settings


@lru_cache(maxsize=1)
def get_storage_session() -> Session:
    return Session()


async def get_s3_client() -> AsyncGenerator[AioBaseClient, None]:
    session = get_storage_session()
    config = Config(signature_version="s3v4")
    async with session.client(
        "s3",
        endpoint_url=settings.storage_endpoint_url,
        aws_access_key_id=settings.MINIO_ROOT_USER,
        aws_secret_access_key=settings.MINIO_ROOT_PASSWORD.get_secret_value(),
        region_name=settings.STORAGE_REGION,
        config=config,
    ) as client:
        yield client
