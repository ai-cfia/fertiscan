"""Label image dependencies."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from sqlalchemy.orm import Session
from sqlmodel import select

from app.db.models.label_image import LabelImage, UploadStatus
from app.dependencies.auth import SessionDep
from app.dependencies.labels import LabelDep, LabelNotCompletedDep, S3ClientDep
from app.exceptions import (
    FileNotFoundInStorage,
    ImageNotCompleted,
    LabelImageNotFound,
)
from app.schemas.label import UploadCompletionRequest
from app.storage import file_exists


# ============================== Utility Functions ==============================
def _get_label_image_by_id_and_label_id(
    session: Session, image_id: UUID, label_id: UUID
) -> LabelImage:
    """Get LabelImage by ID and label_id, raise 404 if not found."""
    if not (
        label_image := session.execute(
            select(LabelImage).where(
                LabelImage.id == image_id, LabelImage.label_id == label_id
            )
        ).scalar_one_or_none()
    ):
        msg = f"LabelImage {image_id} not found for label {label_id}"
        raise LabelImageNotFound(msg)
    return label_image


# ============================== LabelImage Dependencies ==============================
def get_pending_label_image(
    session: SessionDep,
    label: LabelDep,
    request: UploadCompletionRequest,
) -> LabelImage:
    """Get pending LabelImage by storage_file_path or raise 404."""
    stmt = select(LabelImage).where(
        LabelImage.label_id == label.id,
        LabelImage.file_path == request.storage_file_path,
        LabelImage.status == UploadStatus.pending,
    )
    result = session.execute(stmt)
    label_image = result.scalar_one_or_none()
    if not label_image:
        msg = f"Pending LabelImage not found for path: {request.storage_file_path}"
        raise LabelImageNotFound(msg)
    return label_image


PendingLabelImageDep = Annotated[LabelImage, Depends(get_pending_label_image)]


async def verify_file_exists_in_storage(
    s3_client: S3ClientDep,
    label_image: PendingLabelImageDep,
) -> LabelImage:
    """Verify file exists in storage or raise 404."""
    if not await file_exists(s3_client, label_image.file_path):
        msg = f"File not found in storage: {label_image.file_path}"
        raise FileNotFoundInStorage(msg)
    return label_image


VerifiedLabelImageDep = Annotated[LabelImage, Depends(verify_file_exists_in_storage)]


def get_label_image_by_id(
    session: SessionDep, label: LabelDep, image_id: UUID
) -> LabelImage:
    """Get LabelImage by ID, verify it belongs to label, or raise 404."""
    return _get_label_image_by_id_and_label_id(session, image_id, label.id)


LabelImageDep = Annotated[LabelImage, Depends(get_label_image_by_id)]


def get_label_image_by_id_edit(
    session: SessionDep, label: LabelNotCompletedDep, image_id: UUID
) -> LabelImage:
    """Get LabelImage by ID for edit endpoints, verify it belongs to label, or raise 404."""
    return _get_label_image_by_id_and_label_id(session, image_id, label.id)


LabelImageEditDep = Annotated[LabelImage, Depends(get_label_image_by_id_edit)]


def verify_label_image_completed(label_image: LabelImageDep) -> LabelImage:
    """Verify LabelImage is completed or raise 400."""
    if label_image.status != UploadStatus.completed:
        raise ImageNotCompleted()
    return label_image


CompletedLabelImageDep = Annotated[LabelImage, Depends(verify_label_image_completed)]
