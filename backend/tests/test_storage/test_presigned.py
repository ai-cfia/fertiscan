"""Presigned URL generation tests."""

from urllib.parse import parse_qs, urlparse
from uuid import uuid4

import pytest
from mypy_boto3_s3 import S3Client

from app.storage.paths import build_storage_path, generate_storage_filename
from app.storage.presigned import (
    generate_presigned_download_url,
    generate_presigned_upload_url,
)


@pytest.mark.asyncio
class TestGeneratePresignedUploadUrl:
    """Tests for generate_presigned_upload_url function."""

    async def test_generates_valid_url(self, s3_client: S3Client) -> None:
        """Test that presigned upload URL is generated."""
        label_id = uuid4()
        filename = generate_storage_filename("png")
        result = await generate_presigned_upload_url(
            client=s3_client,
            label_id=label_id,
            storage_filename=filename,
            content_type="image/png",
        )
        parsed = urlparse(result.url)
        assert parsed.scheme in ("http", "https")
        assert parsed.netloc
        assert parsed.path
        assert str(label_id) in parsed.path
        assert filename in parsed.path
        params = parse_qs(parsed.query)
        assert "X-Amz-Signature" in params

    async def test_url_includes_content_type(self, s3_client: S3Client) -> None:
        """Test that URL includes content type parameter."""
        label_id = uuid4()
        filename = generate_storage_filename("jpeg")
        result = await generate_presigned_upload_url(
            client=s3_client,
            label_id=label_id,
            storage_filename=filename,
            content_type="image/jpeg",
        )
        assert "content-type" in result.url or "X-Amz-SignedHeaders" in result.url

    async def test_url_includes_file_size_when_provided(
        self, s3_client: S3Client
    ) -> None:
        """Test that URL includes file size when provided."""
        label_id = uuid4()
        filename = generate_storage_filename("png")
        result = await generate_presigned_upload_url(
            client=s3_client,
            label_id=label_id,
            storage_filename=filename,
            content_type="image/png",
            file_size=1024,
        )
        assert "content-length" in result.url

    async def test_custom_expiry(self, s3_client: S3Client) -> None:
        """Test that custom expiry time is used."""
        label_id = uuid4()
        filename = generate_storage_filename("png")
        result = await generate_presigned_upload_url(
            client=s3_client,
            label_id=label_id,
            storage_filename=filename,
            content_type="image/png",
            expiry_minutes=60,
        )
        parsed = urlparse(result.url)
        params = parse_qs(parsed.query)
        assert "X-Amz-Expires" in params
        expires_seconds = int(params["X-Amz-Expires"][0])
        assert expires_seconds == 3600
        # Verify expires_at is set
        assert result.expires_at is not None


@pytest.mark.asyncio
class TestGeneratePresignedDownloadUrl:
    """Tests for generate_presigned_download_url function."""

    async def test_generates_valid_url(self, s3_client: S3Client) -> None:
        """Test that presigned download URL is generated."""
        label_id = uuid4()
        filename = generate_storage_filename("png")
        file_path = build_storage_path(label_id, filename)
        result = await generate_presigned_download_url(
            client=s3_client,
            file_path=file_path,
        )
        parsed = urlparse(result.url)
        assert parsed.scheme in ("http", "https")
        assert parsed.netloc
        assert parsed.path
        assert str(label_id) in parsed.path
        assert filename in parsed.path
        params = parse_qs(parsed.query)
        assert "X-Amz-Signature" in params

    async def test_custom_expiry(self, s3_client: S3Client) -> None:
        """Test that custom expiry time is used."""
        label_id = uuid4()
        filename = generate_storage_filename("png")
        file_path = build_storage_path(label_id, filename)
        result = await generate_presigned_download_url(
            client=s3_client,
            file_path=file_path,
            expiry_minutes=120,
        )
        parsed = urlparse(result.url)
        params = parse_qs(parsed.query)
        assert "X-Amz-Expires" in params
        expires_seconds = int(params["X-Amz-Expires"][0])
        assert expires_seconds == 7200
        # Verify expires_at is set
        assert result.expires_at is not None
