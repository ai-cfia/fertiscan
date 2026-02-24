"""Label API schemas."""

import mimetypes
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.db.models.label import ReviewStatus
from app.db.models.label_image import UploadStatus
from app.schemas.label_data import FertilizerLabelData, LabelData
from app.schemas.product_type import ProductTypePublic
from app.schemas.user import UserPublic

# ============================== Presigned URLs ==============================


class PresignedUrlRequest(BaseModel):
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


class PresignedUploadUrlResponse(BaseModel):
    """Response schema for presigned upload URL request."""

    url: str
    expires_at: datetime


class PresignedDownloadUrlResponse(BaseModel):
    """Response schema for presigned download URL request."""

    presigned_url: str


class UploadCompletionRequest(BaseModel):
    """Request schema for upload completion notification."""

    storage_file_path: str


# ============================== Label Schemas ==============================


class LabelDataLite(BaseModel):
    brand_name_en: str | None = None
    brand_name_fr: str | None = None
    product_name_en: str | None = None
    product_name_fr: str | None = None


class LabelCreate(BaseModel):
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


# ============================== Non-compliance Data Item Schemas ==============================


class NonComplianceDataItemCreate(BaseModel):
    label_id: UUID
    rule_id: UUID
    note: str | None = None
    description_en: str | None = None
    description_fr: str | None = None
    is_compliant: bool = False


class NonComplianceDataItemPublic(NonComplianceDataItemCreate):
    id: UUID


# ============================== Compliance AI result Schema ==============================


class ComplianceResults(BaseModel):
    total: int
    results: dict[UUID, "ComplianceResult"]


class ComplianceResult(BaseModel):
    explanation_en: str = Field(
        ...,
        description="Step-by-step reasoning citing specific evidence from the Label Data that supports or contradicts the regulation's requirements. in English",
    )
    explanation_fr: str = Field(
        ...,
        description="Step-by-step reasoning citing specific evidence from the Label Data that supports or contradicts the regulation's requirements. in French",
    )
    is_compliant: bool = Field(
        ...,
        description="Whether the Label Data satisfies the requirements of the Regulation to Enforce.",
    )


class LabelEvaluationContext(BaseModel):
    """
    A projected view of the Label and its associated technical data
    specifically for LLM rule evaluation.
    """

    model_config = ConfigDict(from_attributes=True)

    label_data: LabelData | None = None
    fertilizer_label_data: FertilizerLabelData | None = None
