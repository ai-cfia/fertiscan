"""Label image routes."""

from fastapi import APIRouter, Query, status

from app.controllers import labels as label_controller
from app.dependencies import (
    CompletedLabelImageDep,
    CurrentUser,
    EditableLabelImageDep,
    LabelDep,
    LabelImageDep,
    S3ClientDep,
    SessionDep,
    StoredPendingImageDep,
    UploadableLabelDep,
)
from app.schemas.label import (
    LabelImageDetail,
    PresignedDownloadUrlResponse,
    PresignedUploadUrlResponse,
    PresignedUrlRequest,
)

router = APIRouter(prefix="/labels", tags=["labels"])


# ============================== LabelImage ==============================
@router.post(
    "/{label_id}/images",
    response_model=LabelImageDetail,
    status_code=status.HTTP_201_CREATED,
)
def create_label_image(
    session: SessionDep,
    _: CurrentUser,
    label: UploadableLabelDep,
    request: PresignedUrlRequest,
) -> LabelImageDetail:
    """Create pending LabelImage record."""
    label_image, current_image_count = label_controller.create_label_image(
        session=session,
        label=label,
        request=request,
    )
    return LabelImageDetail.model_validate(
        label_image, from_attributes=True
    ).model_copy(update={"current_image_count": current_image_count})


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
    label_image: StoredPendingImageDep,
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
    label_image: EditableLabelImageDep,
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
