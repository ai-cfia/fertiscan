"""Label routes."""

from fastapi import APIRouter, Depends, Query, status
from fastapi_pagination import LimitOffsetPage, LimitOffsetParams
from fastapi_pagination.ext.sqlmodel import paginate

from app.controllers import labels as label_controller
from app.db.models.label import ReviewStatus
from app.dependencies import (
    CompletedLabelImageDep,
    CurrentUser,
    LabelDep,
    LabelImageDep,
    LabelWithImageLimitDep,
    ProductTypeDep,
    S3ClientDep,
    SessionDep,
    VerifiedLabelImageDep,
)
from app.schemas.label import (
    LabelCreate,
    LabelCreated,
    LabelDetail,
    LabelImageDetail,
    LabelListItem,
    PresignedDownloadUrlResponse,
    PresignedUploadUrlResponse,
    PresignedUrlRequest,
)

router = APIRouter(prefix="/labels", tags=["labels"])


# ============================== Label ==============================
@router.post(
    "",
    response_model=LabelCreated,
    status_code=status.HTTP_201_CREATED,
)
def create_label(
    session: SessionDep,
    current_user: CurrentUser,
    label_in: LabelCreate,
    product_type: ProductTypeDep,
) -> LabelCreated:
    """Create a new label."""
    return label_controller.create_label(  # type: ignore[return-value]
        session=session,
        user_id=current_user.id,
        product_type_id=product_type.id,
        product_id=label_in.product_id,
    )


@router.get("", response_model=LimitOffsetPage[LabelListItem])
def read_labels(
    session: SessionDep,
    current_user: CurrentUser,
    params: LimitOffsetParams = Depends(),
    product_type: str = Query(default="fertilizer", description="Product type"),
    review_status: ReviewStatus | None = Query(
        default=None, description="Filter by review status"
    ),
    unlinked: bool | None = Query(
        default=None, description="Filter unlinked labels only (product_id is null)"
    ),
    order_by: str = Query(default="created_at", description="Field to sort by"),
    order: str = Query(default="desc", description="Sort direction (asc or desc)"),
) -> LimitOffsetPage[LabelListItem]:
    """List labels with optional filters and sorting."""
    stmt = label_controller.get_labels_query(
        user_id=current_user.id,
        product_type=product_type,
        review_status=review_status,
        unlinked=unlinked,
        order_by=order_by,
        order=order,
    )
    return paginate(session, stmt, params)  # type: ignore[no-any-return, call-overload]


@router.get("/{label_id}", response_model=LabelDetail)
async def read_label(
    session: SessionDep,
    _: CurrentUser,
    label: LabelDep,
) -> LabelDetail:
    """Get label detail with images (without presigned URLs)."""
    return await label_controller.get_label_detail(  # type: ignore[return-value]
        session=session,
        label=label,
    )


@router.delete(
    "/{label_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_label(
    session: SessionDep,
    s3_client: S3ClientDep,
    _: CurrentUser,
    label: LabelDep,
) -> None:
    """Delete a label and its associated storage files."""
    await label_controller.delete_label(
        session=session,
        s3_client=s3_client,
        label=label,
    )


# ============================== LabelImage ==============================
@router.post(
    "/{label_id}/images",
    response_model=LabelImageDetail,
    status_code=status.HTTP_201_CREATED,
)
def create_label_image(
    session: SessionDep,
    _: CurrentUser,
    label: LabelWithImageLimitDep,
    request: PresignedUrlRequest,
) -> LabelImageDetail:
    """Create pending LabelImage record."""
    label_image, current_image_count = label_controller.create_label_image(
        session=session,
        label=label,
        request=request,
    )
    return LabelImageDetail.model_validate(
        label_image.model_dump(), update={"current_image_count": current_image_count}
    )


@router.get("/{label_id}/images", response_model=list[LabelImageDetail])
async def read_label_images(
    session: SessionDep,
    _: CurrentUser,
    label: LabelDep,
) -> list[LabelImageDetail]:
    """Get label images (without presigned URLs)."""
    return await label_controller.get_label_images(  # type: ignore[return-value]
        session=session,
        label=label,
    )


@router.get("/{label_id}/images/{image_id}", response_model=LabelImageDetail)
async def read_label_image(
    _: CurrentUser,
    label_image: LabelImageDep,
) -> LabelImageDetail:
    """Get single label image (without presigned URL)."""
    return label_image  # type: ignore[return-value]


@router.post(
    "/{label_id}/images/complete",
    response_model=LabelImageDetail,
    status_code=status.HTTP_200_OK,
)
async def complete_label_image_upload(
    session: SessionDep,
    _: CurrentUser,
    label_image: VerifiedLabelImageDep,
) -> LabelImageDetail:
    """Complete upload by updating LabelImage status from pending to completed."""
    return await label_controller.complete_label_image_upload(  # type: ignore[return-value]
        session=session,
        label_image=label_image,
    )


@router.delete(
    "/{label_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_label_image(
    session: SessionDep,
    s3_client: S3ClientDep,
    _: CurrentUser,
    label_image: LabelImageDep,
) -> None:
    """Delete a label image, its storage file, and renumber remaining images."""
    await label_controller.delete_label_image(
        session=session,
        s3_client=s3_client,
        label_image=label_image,
    )


# ============================== Presigned URLs ==============================
@router.get(
    "/{label_id}/images/{image_id}/presigned-upload-url",
    response_model=PresignedUploadUrlResponse,
)
async def get_label_image_presigned_upload_url(
    s3_client: S3ClientDep,
    _: CurrentUser,
    label_image: LabelImageDep,
    content_type: str = Query(
        description="Content type (image/png, image/jpeg, image/webp)"
    ),
) -> PresignedUploadUrlResponse:
    """Get presigned upload URL for a pending label image."""
    return await label_controller.get_label_image_presigned_upload_url(  # type: ignore[return-value]
        s3_client=s3_client,
        label_image=label_image,
        content_type=content_type,
    )


@router.get(
    "/{label_id}/images/{image_id}/presigned-download-url",
    response_model=PresignedDownloadUrlResponse,
)
async def get_label_image_presigned_download_url(
    s3_client: S3ClientDep,
    _: CurrentUser,
    label_image: CompletedLabelImageDep,
) -> PresignedDownloadUrlResponse:
    """Get presigned download URL for a completed label image."""
    return await label_controller.get_label_image_presigned_download_url(
        s3_client=s3_client,
        label_image=label_image,
    )
