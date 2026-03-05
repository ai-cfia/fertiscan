"""Label dependencies."""

from typing import Annotated
from uuid import UUID

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from fastapi import Depends
from sqlmodel import select

from app.config import settings
from app.controllers import labels as label_controller
from app.db.models import (
    FertilizerLabelData,
    Label,
    LabelData,
    ReviewStatus,
    UploadStatus,
)
from app.dependencies.auth import SessionDep
from app.exceptions import (
    ImageCountLimitExceeded,
    ImageNotCompleted,
    InvalidProductType,
    LabelCompleted,
    LabelDataNotFound,
    LabelNotCompletedError,
    LabelNotFound,
    LabelNotLinkedToProduct,
    ProductNotFound,
    RegistrationNumberMissing,
    ResourceConflict,
)
from app.schemas.label import LabelReviewStatusUpdate
from app.storage import get_s3_client

# Storage client dependency
S3ClientDep = Annotated[AioBaseClient, Depends(get_s3_client)]


# ============================== Read Endpoints (GET) ==============================
def get_label_by_id(session: SessionDep, label_id: UUID) -> Label:
    """Get label by ID or raise 404."""
    if not (label := session.get(Label, label_id)):
        raise LabelNotFound(str(label_id))
    return label


LabelDep = Annotated[Label, Depends(get_label_by_id)]


# ============================== Mutation Base (Required for POST/PATCH) ==============================
def verify_label_is_editable(label: LabelDep) -> Label:
    """Verify label is not completed, root for all mutations."""
    if label.review_status == ReviewStatus.completed:
        raise LabelCompleted(f"Label {label.id} is completed and cannot be edited")
    return label


EditableLabelDep = Annotated[Label, Depends(verify_label_is_editable)]


# ============================== Create Endpoints (POST / Create Child) ==============================
def ensure_label_has_no_data(session: SessionDep, label: EditableLabelDep) -> Label:
    """Ensure LabelData doesn't exist before creation."""
    if session.scalar(select(LabelData).where(LabelData.label_id == label.id)):
        raise ResourceConflict(f"LabelData already exists for label {label.id}")
    return label


LabelWithoutDataDep = Annotated[Label, Depends(ensure_label_has_no_data)]


def verify_label_is_uploadable(session: SessionDep, label: EditableLabelDep) -> Label:
    """Verify image limit before upload."""
    locked_label, current_count = label_controller.verify_and_lock_label_image_limit(
        session, label
    )
    if current_count >= settings.MAX_IMAGES_PER_LABEL:
        raise ImageCountLimitExceeded(
            current_count=current_count,
            requested_count=1,
            max_count=settings.MAX_IMAGES_PER_LABEL,
        )
    return locked_label


UploadableLabelDep = Annotated[Label, Depends(verify_label_is_uploadable)]


# ============================== Update Endpoints (PATCH / Update Child) ==============================
def verify_completable_if_needed(
    label: LabelDep,
    status_in: LabelReviewStatusUpdate,
) -> Label:
    """Validate completion requirements if targeting completed status."""
    # Only validate if targeting completed status
    if status_in.review_status != ReviewStatus.completed:
        return label

    # Skip validation if already completed (idempotent)
    if label.review_status == ReviewStatus.completed:
        return label

    # Validate label has required data for completion
    if not label.label_data:
        raise LabelDataNotFound()

    if not label.label_data.registration_number:
        raise RegistrationNumberMissing()

    if label.label_data.registration_number.strip() == "":
        raise RegistrationNumberMissing()

    if not label.product_id:
        raise LabelNotLinkedToProduct(label.id)

    return label


ValidatedStatusLabelDep = Annotated[Label, Depends(verify_completable_if_needed)]


async def verify_fertilizer_label_edit(
    session: SessionDep, label: EditableLabelDep
) -> Label:
    """Verify fertilizer type for updates (eagerly loads relationships)."""
    label = await label_controller.get_label_detail(session, label)
    if not label.product_type or label.product_type.code != "fertilizer":
        raise InvalidProductType(f"Label {label.id} is not a fertilizer product type")
    return label


FertilizerLabelDep = Annotated[Label, Depends(verify_fertilizer_label_edit)]


# ============================== Fertilizer Specific Chains ==============================
def ensure_fertilizer_label_has_no_data(
    session: SessionDep, label: FertilizerLabelDep
) -> Label:
    """Ensure FertilizerLabelData doesn't exist before creation."""
    # Robust check: verify product type since this is a fertilizer-specific endpoint
    if not label.product_type or label.product_type.code != "fertilizer":
        raise InvalidProductType(f"Label {label.id} is not a fertilizer product type")

    if session.scalar(
        select(FertilizerLabelData).where(FertilizerLabelData.label_id == label.id)
    ):
        raise ResourceConflict(
            f"FertilizerLabelData already exists for label {label.id}"
        )
    return label


LabelWithoutFertilizerDataDep = Annotated[
    Label, Depends(ensure_fertilizer_label_has_no_data)
]


def verify_label_is_extractable(
    label: FertilizerLabelDep,
) -> Label:
    """Verify images exist before starting extraction."""
    if not any(img.status == UploadStatus.completed for img in label.images):
        raise ImageNotCompleted("Label has no completed images")
    return label


ExtractableLabelDep = Annotated[Label, Depends(verify_label_is_extractable)]


# ====================== Label Completed Verification for Non-Compliance Data Item Endpoint ======================


def verify_label_is_completed(label: LabelDep) -> Label:
    """Verify label is completed before allowing access to non-compliance data items."""

    if label.review_status != ReviewStatus.completed:
        raise LabelNotCompletedError()

    if not label.product_id:
        raise ProductNotFound()

    return label


CompletedLabelDep = Annotated[Label, Depends(verify_label_is_completed)]
