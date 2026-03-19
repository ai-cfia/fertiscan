"""Label API schemas."""

import mimetypes
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.db.models import ComplianceStatus, ReviewStatus, UploadStatus
from app.schemas.label_data import BilingualText, FertilizerLabelData, LabelData
from app.schemas.product_type import ProductTypePublic
from app.schemas.user import UserPublic

# ============================== Presigned URLs ==============================


class PresignedUrlRequest(BaseModel):
    """Request schema for individual presigned URL generation."""

    model_config = ConfigDict(str_strip_whitespace=True)
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


class PresignedUploadUrlResponse(BaseModel):
    """Response schema for presigned upload URL request."""

    url: str
    expires_at: datetime


class PresignedDownloadUrlResponse(BaseModel):
    """Response schema for presigned download URL request."""

    presigned_url: str


class UploadCompletionRequest(BaseModel):
    """Request schema for upload completion notification."""

    model_config = ConfigDict(str_strip_whitespace=True)
    storage_file_path: str


# ============================== Label Schemas ==============================


class LabelDataLite(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    brand_name: BilingualText | None = None
    product_name: BilingualText | None = None
    registration_number: str | None = None


class LabelCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    product_type: str
    product_id: UUID | None = None


class LabelCreated(BaseModel):
    """Response schema for label creation."""

    id: UUID


class LabelListItem(BaseModel):
    """Schema for label list items."""

    id: UUID
    review_status: ReviewStatus
    created_at: datetime
    updated_at: datetime
    label_data: LabelDataLite | None = None


class LabelDetail(BaseModel):
    id: UUID
    product_id: UUID | None = None
    created_by_id: UUID
    review_status: ReviewStatus
    created_at: datetime
    updated_at: datetime
    product_type: ProductTypePublic
    created_by: UserPublic
    images: list["LabelImageDetail"] = Field(default_factory=list)


class LabelUpdate(BaseModel):
    product_id: UUID | None = None


class LabelReviewStatusUpdate(BaseModel):
    review_status: ReviewStatus


# ============================== LabelImage Schemas ==============================


class LabelImageDetail(BaseModel):
    id: UUID
    label_id: UUID
    display_filename: str
    file_path: str
    sequence_order: int
    status: UploadStatus
    created_at: datetime
    updated_at: datetime
    current_image_count: int | None = None


# ============================== Compliance AI result Schema ==============================
class ComplianceResult(BaseModel):
    status: ComplianceStatus = Field(
        ...,
        description="Outcome of the check: compliant, non_compliant, not_applicable, or inconclusive (requires human review).",
    )
    explanation: BilingualText = Field(
        ...,
        description="Think step by step internally but output only the final concise evaluation.",
    )


class ComplianceResults(BaseModel):
    total: int
    results: dict[UUID, ComplianceResult]


class LabelEvaluationContext(BaseModel):
    """
    A projected view of the Label and its associated technical data
    specifically for LLM rule evaluation.
    """

    model_config = ConfigDict(from_attributes=True)

    label_data: LabelData | None = Field(
        default=None, description="This is the data from the label"
    )
    fertilizer_label_data: FertilizerLabelData | None = Field(
        default=None,
        description="This is the data from the fertilizer label",
    )
