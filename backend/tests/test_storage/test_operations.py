"""Storage operations tests."""

import pytest
from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from botocore.exceptions import ClientError

from app.config import settings
from app.storage.operations import delete_file, delete_files


@pytest.mark.asyncio
class TestDeleteFile:
    """Tests for delete_file function."""

    async def test_deletes_existing_file(self, s3_client: AioBaseClient) -> None:
        """Test that existing file is deleted."""
        file_path = "labels/test/file.png"
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=file_path,
            Body=b"test content",
        )
        await delete_file(s3_client, file_path)
        try:
            await s3_client.head_object(
                Bucket=settings.STORAGE_BUCKET_NAME, Key=file_path
            )
            pytest.fail("File should have been deleted")
        except ClientError as e:
            assert e.response["Error"]["Code"] in ("404", "NoSuchKey")

    async def test_deletes_nonexistent_file_gracefully(
        self, s3_client: AioBaseClient
    ) -> None:
        """Test that deleting non-existent file doesn't raise error."""
        file_path = "labels/test/nonexistent.png"
        await delete_file(s3_client, file_path)
        assert True

    async def test_deletes_file_with_special_characters(
        self, s3_client: AioBaseClient
    ) -> None:
        """Test that file with special characters in path is deleted."""
        file_path = "labels/test-123/file_name.png"
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=file_path,
            Body=b"test content",
        )
        await delete_file(s3_client, file_path)
        try:
            await s3_client.head_object(
                Bucket=settings.STORAGE_BUCKET_NAME, Key=file_path
            )
            pytest.fail("File should have been deleted")
        except ClientError as e:
            assert e.response["Error"]["Code"] in ("404", "NoSuchKey")


@pytest.mark.asyncio
class TestDeleteFiles:
    """Tests for delete_files function."""

    async def test_deletes_multiple_files(self, s3_client: AioBaseClient) -> None:
        """Test that multiple files are deleted."""
        file_paths = [
            "labels/test/file1.png",
            "labels/test/file2.png",
            "labels/test/file3.png",
        ]
        for file_path in file_paths:
            await s3_client.put_object(
                Bucket=settings.STORAGE_BUCKET_NAME,
                Key=file_path,
                Body=b"test content",
            )
        await delete_files(s3_client, file_paths)
        for file_path in file_paths:
            try:
                await s3_client.head_object(
                    Bucket=settings.STORAGE_BUCKET_NAME, Key=file_path
                )
                pytest.fail(f"File {file_path} should have been deleted")
            except ClientError as e:
                assert e.response["Error"]["Code"] in ("404", "NoSuchKey")

    async def test_deletes_empty_list(self, s3_client: AioBaseClient) -> None:
        """Test that deleting empty list doesn't raise error."""
        await delete_files(s3_client, [])
        assert True

    async def test_handles_partial_failures(self, s3_client: AioBaseClient) -> None:
        """Test that partial failures don't stop other deletions."""
        file_paths = [
            "labels/test/existing1.png",
            "labels/test/nonexistent.png",
            "labels/test/existing2.png",
        ]
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=file_paths[0],
            Body=b"test content",
        )
        await s3_client.put_object(
            Bucket=settings.STORAGE_BUCKET_NAME,
            Key=file_paths[2],
            Body=b"test content",
        )
        await delete_files(s3_client, file_paths)
        for file_path in [file_paths[0], file_paths[2]]:
            try:
                await s3_client.head_object(
                    Bucket=settings.STORAGE_BUCKET_NAME, Key=file_path
                )
                pytest.fail(f"File {file_path} should have been deleted")
            except ClientError as e:
                assert e.response["Error"]["Code"] in ("404", "NoSuchKey")
