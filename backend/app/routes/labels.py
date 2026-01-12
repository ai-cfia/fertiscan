"""Label routes."""

from fastapi import APIRouter, Depends, Query, status
from fastapi_pagination import LimitOffsetPage, LimitOffsetParams
from fastapi_pagination.ext.sqlmodel import paginate

from app.controllers import labels as label_controller
from app.db.models.label import ExtractionStatus, VerificationStatus
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
    LabelDetail,
    LabelImageDetail,
    LabelPublic,
    PresignedDownloadUrlResponse,
    PresignedUrlRequest,
)

router = APIRouter(prefix="/labels", tags=["labels"])


# ============================== CRUD ==============================
@router.get("", response_model=LimitOffsetPage[LabelPublic])
def read_labels(
    session: SessionDep,
    current_user: CurrentUser,
    params: LimitOffsetParams = Depends(),
    product_type: str = Query(default="fertilizer", description="Product type"),
    verification_status: VerificationStatus | None = Query(
        default=None, description="Filter by verification status"
    ),
    extraction_status: ExtractionStatus | None = Query(
        default=None, description="Filter by extraction status"
    ),
    unlinked: bool | None = Query(
        default=None, description="Filter unlinked labels only (product_id is null)"
    ),
) -> LimitOffsetPage[LabelPublic]:
    """List labels with optional filters."""
    stmt = label_controller.get_labels_query(
        user_id=current_user.id,
        product_type=product_type,
        verification_status=verification_status,
        extraction_status=extraction_status,
        unlinked=unlinked,
    )
    return paginate(session, stmt, params)  # type: ignore[no-any-return, call-overload]


@router.post(
    "",
    response_model=LabelPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_label(
    session: SessionDep,
    current_user: CurrentUser,
    label_in: LabelCreate,
    product_type: ProductTypeDep,
) -> LabelPublic:
    """Create a new label."""
    label = label_controller.create_label(
        session=session,
        user_id=current_user.id,
        product_type_id=product_type.id,
        product_id=label_in.product_id,
    )
    return LabelPublic(id=label.id)


@router.get("/{label_id}", response_model=LabelDetail)
async def read_label(
    session: SessionDep,
    _: CurrentUser,
    label: LabelDep,
) -> LabelDetail:
    """Get label detail with images (without presigned URLs)."""
    return await label_controller.get_label_detail(
        session=session,
        label=label,
    )


@router.get("/{label_id}/images/{image_id}", response_model=LabelImageDetail)
async def read_label_image(
    _: CurrentUser,
    label_image: LabelImageDep,
) -> LabelImageDetail:
    """Get single label image (without presigned URL)."""
    return await label_controller.get_label_image(
        label_image=label_image,
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


@router.get("/{label_id}/images", response_model=list[LabelImageDetail])
async def read_label_images(
    session: SessionDep,
    _: CurrentUser,
    label: LabelDep,
) -> list[LabelImageDetail]:
    """Get label images (without presigned URLs)."""
    return await label_controller.get_label_images(
        session=session,
        label=label,
    )


@router.post(
    "/{label_id}/images",
    response_model=LabelImageDetail,
    status_code=status.HTTP_201_CREATED,
)
async def create_label_image(
    session: SessionDep,
    s3_client: S3ClientDep,
    _: CurrentUser,
    label: LabelWithImageLimitDep,
    request: PresignedUrlRequest,
) -> LabelImageDetail:
    """Create pending LabelImage and generate presigned URL for upload."""
    return await label_controller.create_label_image(
        session=session,
        s3_client=s3_client,
        label=label,
        request=request,
    )


@router.post(
    "/{label_id}/images/complete",
    response_model=LabelPublic,
    status_code=status.HTTP_200_OK,
)
async def complete_label_image_upload(
    session: SessionDep,
    _: CurrentUser,
    label_image: VerifiedLabelImageDep,
) -> LabelPublic:
    """Complete upload by updating LabelImage status from pending to completed."""
    await label_controller.complete_label_image_upload(
        session=session,
        label_image=label_image,
    )
    return LabelPublic(id=label_image.label_id)


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
