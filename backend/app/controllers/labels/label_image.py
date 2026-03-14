"""LabelImage CRUD operations."""

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from pydantic import validate_call
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from sqlmodel import select

from app import storage
from app.db.models import Label, LabelImage, UploadStatus
from app.schemas.label import (
    PresignedDownloadUrlResponse,
    PresignedUrlRequest,
)
from app.storage.presigned import PresignedUrl


@validate_call(config={"arbitrary_types_allowed": True})
def verify_and_lock_label_image_limit(
    session: Session,
    label: Label,
) -> tuple[Label, int]:
    """Lock label and verify it hasn't reached max image limit. Returns (locked_label, current_count)."""
    locked_label_stmt = select(Label).where(Label.id == label.id).with_for_update()
    locked_label = session.execute(locked_label_stmt).scalar_one()
    count_stmt = (
        select(func.count())
        .select_from(LabelImage)
        .where(LabelImage.label_id == label.id)
    )
    current_count = session.execute(count_stmt).scalar_one()
    return (locked_label, current_count)


@validate_call(config={"arbitrary_types_allowed": True})
def create_label_image(
    session: Session,
    label: Label,
    request: PresignedUrlRequest,
) -> tuple[LabelImage, int]:
    """Create pending LabelImage record. Returns (LabelImage,
    current_image_count)."""
    # Generate storage filename and path
    storage_filename = storage.generate_storage_filename(request.extension)
    storage_file_path = storage.build_storage_path(label.id, storage_filename)

    # Create LabelImage record with status='pending'
    label_image = LabelImage(
        label_id=label.id,
        file_path=storage_file_path,
        display_filename=request.display_filename,
        sequence_order=request.sequence_order,
        status=UploadStatus.pending,
    )
    session.add(label_image)
    session.flush()

    # Refresh to get updated count
    session.refresh(label)
    current_image_count = len(label.images)

    return (label_image, current_image_count)


@validate_call(config={"arbitrary_types_allowed": True})
async def get_label_images(
    session: Session,
    label: Label,
) -> list[LabelImage]:
    """Get label images (without presigned URLs)."""
    stmt = (
        select(Label).where(Label.id == label.id).options(selectinload(Label.images))  # type: ignore[arg-type]
    )
    result = session.execute(stmt)
    label_with_images = result.scalar_one()
    return label_with_images.images


@validate_call(config={"arbitrary_types_allowed": True})
async def complete_label_image_upload(
    session: Session,
    label_image: LabelImage,
) -> LabelImage:
    """Complete upload by updating LabelImage status from pending to completed.
    Returns the updated LabelImage model."""
    # Update status from 'pending' to 'completed'
    label_image.status = UploadStatus.completed
    session.add(label_image)
    session.flush()
    session.refresh(label_image)
    return label_image


@validate_call(config={"arbitrary_types_allowed": True})
async def delete_label_image(
    session: Session,
    s3_client: AioBaseClient,
    label_image: LabelImage,
) -> None:
    """Delete a label image, its storage file, and renumber remaining images."""
    label_id = label_image.label_id
    file_path = label_image.file_path
    await storage.delete_file(s3_client, file_path)
    session.delete(label_image)
    session.flush()
    stmt = (
        select(LabelImage)
        .where(LabelImage.label_id == label_id)
        .order_by(LabelImage.sequence_order)  # type: ignore[arg-type]
    )
    result = session.execute(stmt)
    remaining_images = list(result.scalars().all())
    # Two-pass renumbering to avoid UNIQUE constraint violations when updating
    # sequence_order values that overlap
    max_order = len(remaining_images) + 1000
    for index, img in enumerate(remaining_images, start=1):
        img.sequence_order = max_order + index
        session.add(img)
    session.flush()
    # TODO: Revisit - consider single-pass SQL UPDATE with subquery to avoid two
    # flushes
    for index, img in enumerate(remaining_images, start=1):
        img.sequence_order = index
        session.add(img)
    session.flush()


@validate_call(config={"arbitrary_types_allowed": True})
async def get_label_image_presigned_upload_url(
    s3_client: AioBaseClient,
    label_image: LabelImage,
    content_type: str,
) -> PresignedUrl:
    """Generate presigned upload URL for a pending LabelImage."""
    return await storage.generate_presigned_upload_url(
        client=s3_client,
        label_id=label_image.label_id,
        storage_filename=label_image.file_path.split("/")[-1],
        content_type=content_type,
    )


@validate_call(config={"arbitrary_types_allowed": True})
async def get_label_image_presigned_download_url(
    s3_client: AioBaseClient,
    label_image: LabelImage,
) -> PresignedDownloadUrlResponse:
    """Get presigned download URL for a completed label image."""
    presigned_url_result = await storage.generate_presigned_download_url(
        s3_client, label_image.file_path
    )
    if not isinstance(presigned_url_result, PresignedUrl):
        raise ValueError("Failed to generate presigned URL")
    return PresignedDownloadUrlResponse(presigned_url=presigned_url_result.url)
