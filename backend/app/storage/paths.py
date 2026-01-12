"""Storage path and filename utilities."""

from uuid import UUID, uuid4

from pydantic import validate_call


@validate_call
def generate_storage_filename(extension: str) -> str:
    """Generate UUID-based storage filename with extension."""
    return f"{uuid4()}.{extension}"


@validate_call
def build_storage_path(label_id: UUID, filename: str) -> str:
    """Build storage path: labels/{label_id}/{filename}"""
    return f"labels/{label_id}/{filename}"
