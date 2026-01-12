"""Storage path utility tests."""

from uuid import UUID, uuid4

import pytest

from app.storage.paths import build_storage_path, generate_storage_filename


class TestGenerateStorageFilename:
    """Tests for generate_storage_filename function."""

    def test_generates_uuid_with_extension(self) -> None:
        """Test that filename is UUID with extension."""
        filename = generate_storage_filename("png")
        parts = filename.split(".")
        assert len(parts) == 2
        assert parts[1] == "png"
        try:
            UUID(parts[0])
        except ValueError:
            pytest.fail("Filename does not contain valid UUID")

    def test_different_calls_generate_different_names(self) -> None:
        """Test that each call generates a unique filename."""
        name1 = generate_storage_filename("png")
        name2 = generate_storage_filename("png")
        assert name1 != name2

    def test_supports_various_extensions(self) -> None:
        """Test that various extensions are supported."""
        for ext in ["png", "jpeg", "webp", "jpg"]:
            filename = generate_storage_filename(ext)
            assert filename.endswith(f".{ext}")


class TestBuildStoragePath:
    """Tests for build_storage_path function."""

    def test_builds_correct_path(self) -> None:
        """Test that path is built correctly."""
        label_id = uuid4()
        filename = "test.png"
        path = build_storage_path(label_id, filename)
        assert path == f"labels/{label_id}/{filename}"

    def test_path_format(self) -> None:
        """Test that path follows expected format."""
        label_id = uuid4()
        filename = generate_storage_filename("png")
        path = build_storage_path(label_id, filename)
        assert path.startswith("labels/")
        assert str(label_id) in path
        assert path.endswith(filename)
