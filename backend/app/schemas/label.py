"""Label API schemas."""

import mimetypes
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import computed_field
from sqlmodel import Field, SQLModel

from app.db.models.label import ExtractionStatus, VerificationStatus
from app.db.models.label_image import UploadStatus


class PresignedUrlRequest(SQLModel):
    """Request schema for individual presigned URL generation."""

    display_filename: str
    content_type: Literal["image/png", "image/jpeg", "image/webp"]
    sequence_order: int = Field(ge=1)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def extension(self) -> str:
        """Extract file extension from validated content type."""
        ext = mimetypes.guess_extension(self.content_type)
        assert ext is not None
        return ext.lstrip(".")


class UploadCompletionRequest(SQLModel):
    """Request schema for upload completion notification."""

    storage_file_path: str


class PresignedDownloadUrlResponse(SQLModel):
    """Response schema for presigned download URL request."""

    presigned_url: str


class LabelCreate(SQLModel):
    product_type: str
    product_id: UUID | None = None


class LabelPublic(SQLModel):
    id: UUID


class LabelImageDetail(SQLModel):
    id: UUID
    display_filename: str
    storage_file_path: str
    sequence_order: int
    status: UploadStatus
    presigned_url: str | None = None
    current_image_count: int | None = None


class LabelDetail(SQLModel):
    id: UUID
    extraction_status: ExtractionStatus
    verification_status: VerificationStatus
    extraction_error_message: str | None = None
    created_at: datetime
    updated_at: datetime
    images: list[LabelImageDetail] = Field(default_factory=list)
    has_label_data: bool = False
