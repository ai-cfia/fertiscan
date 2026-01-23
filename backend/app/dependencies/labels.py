"""Label dependencies."""

from typing import Annotated
from uuid import UUID

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from fastapi import Depends
from sqlalchemy.orm import Session
from sqlmodel import select

from app.config import settings
from app.controllers import labels as label_controller
from app.controllers.product_types import get_product_type_by_code
from app.db.models.fertilizer_label_data import FertilizerLabelData
from app.db.models.label import Label, ReviewStatus
from app.db.models.label_data import LabelData
from app.db.models.label_image import UploadStatus
from app.db.models.product_type import ProductType
from app.dependencies.auth import SessionDep
from app.exceptions import (
    ImageCountLimitExceeded,
    ImageNotCompleted,
    InvalidProductType,
    LabelCompleted,
    LabelNotFound,
    LabelNotLinkedToProduct,
    ProductTypeNotFound,
    ResourceConflict,
)
from app.schemas.label import LabelCreate, LabelReviewStatusUpdate
from app.storage import get_s3_client

# Storage client dependency
S3ClientDep = Annotated[AioBaseClient, Depends(get_s3_client)]


# ============================== Utility Functions ==============================
def _check_label_data_exists(session: Session, label_id: UUID) -> bool:
    """Check if LabelData exists for a given label."""
    result = session.execute(select(LabelData).where(LabelData.label_id == label_id))
    return result.scalar_one_or_none() is not None


def _check_fertilizer_label_data_exists(session: Session, label_id: UUID) -> bool:
    """Check if FertilizerLabelData exists for a given label."""
    result = session.execute(
        select(FertilizerLabelData).where(FertilizerLabelData.label_id == label_id)
    )
    return result.scalar_one_or_none() is not None


def _verify_label_has_completed_images(label: Label) -> None:
    """Verify label has completed images, raise 400 if none."""
    if not any(img.status == UploadStatus.completed for img in label.images):
        raise ImageNotCompleted("Label has no completed images")


def _verify_fertilizer_product_type(label: Label) -> None:
    """Verify label is fertilizer product type, raise 400 if not."""
    if not label.product_type or label.product_type.code != "fertilizer":
        raise InvalidProductType(f"Label {label.id} is not a fertilizer product type")


def _verify_image_limit(session: Session, label: Label) -> Label:
    """Verify label hasn't reached max image limit, return locked label."""
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


# ============================== Resource Dependencies ==============================
def get_label_by_id(session: SessionDep, label_id: UUID) -> Label:
    """Get label by ID or raise 404."""
    if not (label := session.get(Label, label_id)):
        raise LabelNotFound(str(label_id))
    return label


LabelDep = Annotated[Label, Depends(get_label_by_id)]


def get_product_type(session: SessionDep, label_in: LabelCreate) -> ProductType:
    """Get product type from label create request or raise 400."""
    if not (product_type := get_product_type_by_code(session, label_in.product_type)):
        raise ProductTypeNotFound(label_in.product_type)
    return product_type


ProductTypeDep = Annotated[ProductType, Depends(get_product_type)]


# ============================== Label with Relationships Dependencies ==============================
def get_label_with_images_and_product_type(
    session: SessionDep, label: LabelDep
) -> Label:
    """Eagerly load images and product_type relationships for extraction endpoints."""
    return label_controller.load_label_with_images_and_product_type(session, label)


LabelWithImagesAndProductTypeDep = Annotated[
    Label, Depends(get_label_with_images_and_product_type)
]


# ============================== Product Type Validation Dependencies ==============================
def verify_fertilizer_product_type(label: LabelWithImagesAndProductTypeDep) -> Label:
    """Verify label is fertilizer product type, raise 400 if not. Product_type already loaded."""
    _verify_fertilizer_product_type(label)
    return label


FertilizerTypeLabelDep = Annotated[Label, Depends(verify_fertilizer_product_type)]


def ensure_fertilizer_label_data_not_exists(
    session: SessionDep, label: FertilizerTypeLabelDep
) -> Label:
    """Ensure FertilizerLabelData doesn't exist for label, raise 409 if it does."""
    if _check_fertilizer_label_data_exists(session, label.id):
        msg = f"FertilizerLabelData already exists for label {label.id}"
        raise ResourceConflict(msg)
    return label


FertilizerLabelDataNotExistsDep = Annotated[
    Label, Depends(ensure_fertilizer_label_data_not_exists)
]


def ensure_label_data_not_exists(session: SessionDep, label: LabelDep) -> Label:
    """Ensure LabelData doesn't exist for label, raise 409 if it does."""
    if _check_label_data_exists(session, label.id):
        raise ResourceConflict(f"LabelData already exists for label {label.id}")
    return label


LabelDataNotExistsDep = Annotated[Label, Depends(ensure_label_data_not_exists)]


def verify_label_has_completed_images(label: LabelWithImagesAndProductTypeDep) -> Label:
    """Verify label has completed images, raise 400 if none."""
    _verify_label_has_completed_images(label)
    return label


LabelWithCompletedImagesDep = Annotated[
    Label, Depends(verify_label_has_completed_images)
]


def verify_label_has_completed_images_for_fertilizer(
    label: FertilizerTypeLabelDep,
) -> Label:
    """Verify fertilizer label has completed images, raise 400 if none."""
    _verify_label_has_completed_images(label)
    return label


FertilizerTypeLabelWithCompletedImagesDep = Annotated[
    Label, Depends(verify_label_has_completed_images_for_fertilizer)
]


def verify_label_image_limit(session: SessionDep, label: LabelDep) -> Label:
    """Verify label hasn't reached max image limit."""
    return _verify_image_limit(session, label)


LabelWithImageLimitDep = Annotated[Label, Depends(verify_label_image_limit)]


# ============================== Review Status Validation Dependencies ==============================
def verify_label_not_completed(label: LabelDep) -> Label:
    """Verify label is not completed, raise 400 if it is."""
    if label.review_status == ReviewStatus.completed:
        raise LabelCompleted(f"Label {label.id} is completed and cannot be edited")
    return label


LabelNotCompletedDep = Annotated[Label, Depends(verify_label_not_completed)]


def ensure_label_data_not_exists_edit(
    session: SessionDep, label: LabelNotCompletedDep
) -> Label:
    """Ensure LabelData doesn't exist for label (edit), raise 409 if it does."""
    if _check_label_data_exists(session, label.id):
        raise ResourceConflict(f"LabelData already exists for label {label.id}")
    return label


LabelDataNotExistsEditDep = Annotated[Label, Depends(ensure_label_data_not_exists_edit)]


# ============================== Edit Chain Dependencies ==============================
def get_label_with_images_and_product_type_edit(
    session: SessionDep, label: LabelNotCompletedDep
) -> Label:
    """Eagerly load images and product_type relationships for edit endpoints."""
    return label_controller.load_label_with_images_and_product_type(session, label)


LabelWithImagesAndProductTypeEditDep = Annotated[
    Label, Depends(get_label_with_images_and_product_type_edit)
]


def verify_fertilizer_product_type_edit(
    label: LabelWithImagesAndProductTypeEditDep,
) -> Label:
    """Verify label is fertilizer product type for edit endpoints, raise 400 if not."""
    _verify_fertilizer_product_type(label)
    return label


FertilizerTypeLabelEditDep = Annotated[
    Label, Depends(verify_fertilizer_product_type_edit)
]


def ensure_fertilizer_label_data_not_exists_edit(
    session: SessionDep, label: FertilizerTypeLabelEditDep
) -> Label:
    """Ensure FertilizerLabelData doesn't exist for label (edit), raise 409 if it does."""
    if _check_fertilizer_label_data_exists(session, label.id):
        msg = f"FertilizerLabelData already exists for label {label.id}"
        raise ResourceConflict(msg)
    return label


FertilizerLabelDataNotExistsEditDep = Annotated[
    Label, Depends(ensure_fertilizer_label_data_not_exists_edit)
]


def verify_label_has_completed_images_for_fertilizer_edit(
    label: FertilizerTypeLabelEditDep,
) -> Label:
    """Verify fertilizer label has completed images for edit endpoints, raise 400 if none."""
    _verify_label_has_completed_images(label)
    return label


FertilizerTypeLabelWithCompletedImagesEditDep = Annotated[
    Label, Depends(verify_label_has_completed_images_for_fertilizer_edit)
]


def verify_label_image_limit_edit(
    session: SessionDep, label: LabelNotCompletedDep
) -> Label:
    """Verify label hasn't reached max image limit for edit endpoints."""
    return _verify_image_limit(session, label)


LabelWithImageLimitEditDep = Annotated[Label, Depends(verify_label_image_limit_edit)]


def verify_label_has_product_for_completion(
    label: LabelDep, status_in: LabelReviewStatusUpdate
) -> Label:
    """Verify label has associated product before allowing completion."""
    if status_in.review_status == ReviewStatus.completed and label.product_id is None:
        raise LabelNotLinkedToProduct()
    return label


LabelWithProductForCompletionDep = Annotated[
    Label, Depends(verify_label_has_product_for_completion)
]
