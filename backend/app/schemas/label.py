"""Label API schemas."""

import mimetypes
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import computed_field
from sqlmodel import Field, SQLModel

from app.db.models.label import ExtractionStatus, VerificationStatus
from app.db.models.label_image import UploadStatus
from app.schemas.product import ProductPublic
from app.schemas.product_type import ProductTypePublic
from app.schemas.user import UserPublic


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


class PresignedUploadUrlResponse(SQLModel):
    """Response schema for presigned upload URL request."""

    url: str
    expires_at: datetime


class PresignedDownloadUrlResponse(SQLModel):
    """Response schema for presigned download URL request."""

    presigned_url: str


class LabelCreate(SQLModel):
    product_type: str
    product_id: UUID | None = None


class LabelCreated(SQLModel):
    """Response schema for label creation."""

    id: UUID


class LabelListItem(SQLModel):
    """Schema for label list items."""

    id: UUID
    extraction_status: ExtractionStatus
    verification_status: VerificationStatus
    extraction_error_message: str | None = None
    created_at: datetime
    updated_at: datetime
    product: ProductPublic | None = None


class LabelImageDetail(SQLModel):
    id: UUID
    label_id: UUID
    display_filename: str
    file_path: str
    sequence_order: int
    status: UploadStatus
    created_at: datetime
    updated_at: datetime
    current_image_count: int | None = None


class LabelDetail(SQLModel):
    id: UUID
    product_id: UUID | None = None
    created_by_id: UUID
    extraction_status: ExtractionStatus
    verification_status: VerificationStatus
    extraction_error_message: str | None = None
    created_at: datetime
    updated_at: datetime
    product_type: ProductTypePublic
    created_by: UserPublic
    images: list[LabelImageDetail] = Field(default_factory=list)
