"""Storage client for S3-compatible object storage (MinIO)."""

from app.storage.client import get_s3_client
from app.storage.init import init_storage
from app.storage.operations import delete_file, delete_files, download_file, file_exists
from app.storage.paths import build_storage_path, generate_storage_filename
from app.storage.presigned import (
    generate_presigned_download_url,
    generate_presigned_upload_url,
)

__all__ = [
    "get_s3_client",
    "init_storage",
    "build_storage_path",
    "delete_file",
    "delete_files",
    "download_file",
    "file_exists",
    "generate_storage_filename",
    "generate_presigned_upload_url",
    "generate_presigned_download_url",
]
