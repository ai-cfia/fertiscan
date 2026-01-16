"""Label CRUD operations."""

from typing import Any
from uuid import UUID

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from pydantic import validate_call
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.label import Label, ReviewStatus
from app.db.models.label_image import LabelImage, UploadStatus
from app.db.models.product import Product
from app.db.models.product_type import ProductType
from app.schemas.label import (
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


# ============================== Label ==============================
def _apply_label_sorting(
    stmt: SelectOfScalar[Label],
    order_by: str,
    order: str,
) -> SelectOfScalar[Label]:
    """Apply sorting to labels query."""
    valid_sort_fields: dict[str, Any] = {
        "id": Label.id,
        "created_at": Label.created_at,
        "createdAt": Label.created_at,
        "review_status": Label.review_status,
        "reviewStatus": Label.review_status,
    }
    if order_by in ("productName", "product_name"):
        stmt = stmt.outerjoin(Product, Label.product_id == Product.id)  # type: ignore[arg-type]
        product_name_sort = func.coalesce(
            Product.name_en,
            Product.name_fr,
            Product.registration_number,
        )
        valid_sort_fields["productName"] = product_name_sort
        valid_sort_fields["product_name"] = product_name_sort
    sort_column: Any = valid_sort_fields.get(order_by, Label.created_at)
    if order.lower() == "asc":
        stmt = stmt.order_by(sort_column.asc())
    else:
        stmt = stmt.order_by(sort_column.desc())
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
def get_labels_query(
    user_id: UUID,  # noqa: ARG001
    product_type: str = "fertilizer",
    review_status: ReviewStatus | None = None,
    unlinked: bool | None = None,
    order_by: str = "created_at",
    order: str = "desc",
) -> SelectOfScalar[Label]:
    """Build labels query with optional filters and sorting."""
    stmt = select(Label)

    # Filter by product type
    stmt = stmt.join(ProductType).where(
        ProductType.code == product_type,
        ProductType.is_active,
    )

    # Filter by review status
    if review_status is not None:
        stmt = stmt.where(Label.review_status == review_status)

    # Filter unlinked labels
    if unlinked is True:
        stmt = stmt.where(Label.product_id == None)  # noqa: E711

    # Apply sorting
    stmt = _apply_label_sorting(stmt, order_by, order)

    # Eagerly load product relationship for list view
    stmt = stmt.options(selectinload(Label.product))  # type: ignore[arg-type]

    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
async def get_label_detail(
    session: Session,
    label: Label,
) -> Label:
    """Get label detail with images, product_type, and created_by relationships
    loaded."""
    # Eager load relationships
    stmt = (
        select(Label)
        .where(Label.id == label.id)
        .options(
            selectinload(Label.images),  # type: ignore[arg-type]
            selectinload(Label.product_type),  # type: ignore[arg-type]
            selectinload(Label.created_by),  # type: ignore[arg-type]
        )
    )
    result = session.execute(stmt)
    return result.scalar_one()


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


# ============================== LabelImage ==============================
@validate_call(config={"arbitrary_types_allowed": True})
def create_label_image(
    session: Session,
    label: Label,
    request: PresignedUrlRequest,
) -> tuple[LabelImage, int]:
    """Create pending LabelImage record. Returns (LabelImage,
    current_image_count)."""
    # Generate storage filename and path
    storage_filename = generate_storage_filename(request.extension)
    storage_file_path = build_storage_path(label.id, storage_filename)

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
    return sorted(label_with_images.images, key=lambda x: x.sequence_order)


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


# ============================== Presigned URLs ==============================
@validate_call(config={"arbitrary_types_allowed": True})
async def get_label_image_presigned_upload_url(
    s3_client: AioBaseClient,
    label_image: LabelImage,
    content_type: str,
) -> PresignedUrl:
    """Generate presigned upload URL for a pending LabelImage."""
    return await generate_presigned_upload_url(
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
    presigned_url_result = await generate_presigned_download_url(
        s3_client, label_image.file_path
    )
    if not isinstance(presigned_url_result, PresignedUrl):
        raise ValueError("Failed to generate presigned URL")
    return PresignedDownloadUrlResponse(presigned_url=presigned_url_result.url)
