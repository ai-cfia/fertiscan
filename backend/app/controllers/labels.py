"""Label CRUD operations."""

import asyncio
from uuid import UUID

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from pydantic import validate_call
from sqlalchemy.orm import Session, selectinload
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.label import ExtractionStatus, Label, VerificationStatus
from app.db.models.label_image import LabelImage, UploadStatus
from app.db.models.product_type import ProductType
from app.schemas.label import (
    LabelDetail,
    LabelImageDetail,
    PresignedDownloadUrlResponse,
    PresignedUrlRequest,
)
from app.storage import (
    build_storage_path,
    delete_file,
    delete_files,
    generate_presigned_download_url,
    generate_presigned_upload_url,
    generate_storage_filename,
)
from app.storage.presigned import PresignedUrl


@validate_call(config={"arbitrary_types_allowed": True})
def get_labels_query(
    user_id: UUID,  # noqa: ARG001
    product_type: str = "fertilizer",
    verification_status: VerificationStatus | None = None,
    extraction_status: ExtractionStatus | None = None,
    unlinked: bool | None = None,
) -> SelectOfScalar[Label]:
    """Build labels query with optional filters."""
    stmt = select(Label)

    # Filter by product type
    stmt = stmt.join(ProductType).where(
        ProductType.code == product_type,
        ProductType.is_active,
    )

    # Filter by verification status
    if verification_status is not None:
        stmt = stmt.where(Label.verification_status == verification_status)

    # Filter by extraction status
    if extraction_status is not None:
        stmt = stmt.where(Label.extraction_status == extraction_status)

    # Filter unlinked labels
    if unlinked is True:
        stmt = stmt.where(Label.product_id == None)  # noqa: E711

    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
def create_label(
    session: Session,
    user_id: UUID,
    product_type_id: UUID,
    product_id: UUID | None = None,
) -> Label:
    label = Label(
        product_type_id=product_type_id,
        created_by_id=user_id,
        product_id=product_id,
    )
    session.add(label)
    session.flush()
    session.refresh(label)
    return label


@validate_call(config={"arbitrary_types_allowed": True})
async def create_label_image(
    session: Session,
    s3_client: AioBaseClient,
    label: Label,
    request: PresignedUrlRequest,
) -> LabelImageDetail:
    """Create pending LabelImage record and generate presigned URL for
    upload."""
    # Generate storage filename and path
    storage_filename = generate_storage_filename(request.extension)
    storage_file_path = build_storage_path(label.id, storage_filename)

    # Generate presigned URL (returns URL and expires_at)
    presigned_url_result = await generate_presigned_upload_url(
        client=s3_client,
        label_id=label.id,
        storage_filename=storage_filename,
        content_type=request.content_type,
    )

    # Create LabelImage record with status='pending'
    label_image = LabelImage(
        label_id=label.id,
        file_path=storage_file_path,
        display_filename=request.display_filename,
        sequence_order=request.sequence_order,
        status=UploadStatus.pending,
        presigned_url_expires_at=presigned_url_result.expires_at,
    )
    session.add(label_image)
    session.flush()

    # Refresh to get updated count
    session.refresh(label)
    current_image_count = len(label.images)

    return LabelImageDetail(
        id=label_image.id,
        display_filename=label_image.display_filename,
        storage_file_path=label_image.file_path,
        sequence_order=label_image.sequence_order,
        status=label_image.status,
        presigned_url=presigned_url_result.url,
        current_image_count=current_image_count,
    )


@validate_call(config={"arbitrary_types_allowed": True})
async def complete_label_image_upload(
    session: Session,
    label_image: LabelImage,
) -> LabelImage:
    """Complete upload by updating LabelImage status from pending to
    completed."""
    # Sleep to simulate delay for testing cache update
    await asyncio.sleep(2)
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
    await delete_file(s3_client, file_path)
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
async def delete_label(
    session: Session,
    s3_client: AioBaseClient,
    label: Label,
) -> None:
    """Delete a label and its associated storage files."""
    file_paths = [img.file_path for img in label.images]
    if file_paths:
        await delete_files(s3_client, file_paths)
    session.delete(label)
    session.flush()


@validate_call(config={"arbitrary_types_allowed": True})
async def get_label_detail(
    session: Session,
    label: Label,
) -> LabelDetail:
    """Get label detail with images (without presigned URLs)."""
    # Eager load images and label_data relationships
    stmt = (
        select(Label)
        .where(Label.id == label.id)
        .options(selectinload(Label.images), selectinload(Label.label_data))  # type: ignore[arg-type]
    )
    result = session.execute(stmt)
    label_with_relations = result.scalar_one()
    sorted_images = sorted(label_with_relations.images, key=lambda x: x.sequence_order)
    images_detail = [
        LabelImageDetail(
            id=img.id,
            display_filename=img.display_filename,
            storage_file_path=img.file_path,
            sequence_order=img.sequence_order,
            status=img.status,
            presigned_url=None,
        )
        for img in sorted_images
    ]
    return LabelDetail(
        id=label_with_relations.id,
        extraction_status=label_with_relations.extraction_status,
        verification_status=label_with_relations.verification_status,
        extraction_error_message=label_with_relations.extraction_error_message,
        created_at=label_with_relations.created_at,
        updated_at=label_with_relations.updated_at,
        images=images_detail,
        has_label_data=label_with_relations.label_data is not None,
    )


@validate_call(config={"arbitrary_types_allowed": True})
async def get_label_images(
    session: Session,
    label: Label,
) -> list[LabelImageDetail]:
    """Get label images (without presigned URLs)."""
    stmt = (
        select(Label).where(Label.id == label.id).options(selectinload(Label.images))  # type: ignore[arg-type]
    )
    result = session.execute(stmt)
    label_with_images = result.scalar_one()
    sorted_images = sorted(label_with_images.images, key=lambda x: x.sequence_order)
    return [
        LabelImageDetail(
            id=img.id,
            display_filename=img.display_filename,
            storage_file_path=img.file_path,
            sequence_order=img.sequence_order,
            status=img.status,
            presigned_url=None,
        )
        for img in sorted_images
    ]


@validate_call(config={"arbitrary_types_allowed": True})
async def get_label_image(
    label_image: LabelImage,
) -> LabelImageDetail:
    """Get single label image (without presigned URL)."""
    return LabelImageDetail(
        id=label_image.id,
        display_filename=label_image.display_filename,
        storage_file_path=label_image.file_path,
        sequence_order=label_image.sequence_order,
        status=label_image.status,
        presigned_url=None,
    )


@validate_call(config={"arbitrary_types_allowed": True})
async def get_label_image_presigned_download_url(
    s3_client: AioBaseClient,
    label_image: LabelImage,
) -> PresignedDownloadUrlResponse:
    """Get presigned download URL for a completed label image."""
    presigned_url_result = await generate_presigned_download_url(
        s3_client, label_image.file_path
    )
    if not isinstance(presigned_url_result, PresignedUrl):
        raise ValueError("Failed to generate presigned URL")
    return PresignedDownloadUrlResponse(presigned_url=presigned_url_result.url)
