"""FastAPI dependency injection."""

from typing import Annotated
from uuid import UUID

import jwt
from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlalchemy.orm import Session
from sqlmodel import func, select

from app.config import settings
from app.controllers.product_types import get_product_type_by_code
from app.core import security
from app.db.models.label import Label
from app.db.models.label_image import LabelImage, UploadStatus
from app.db.models.product_type import ProductType
from app.db.models.user import User
from app.db.session import get_session
from app.exceptions import (
    FileNotFoundInStorage,
    ImageCountLimitExceeded,
    ImageNotCompleted,
    InactiveUser,
    InsufficientPrivileges,
    InvalidCredentials,
    LabelImageNotFound,
    LabelNotFound,
    ProductTypeNotFound,
    UserNotFound,
)
from app.schemas.auth import TokenPayload
from app.schemas.label import LabelCreate, UploadCompletionRequest
from app.storage import file_exists, get_s3_client

# Database session dependency
SessionDep = Annotated[Session, Depends(get_session)]

# Storage client dependency
S3ClientDep = Annotated[AioBaseClient, Depends(get_s3_client)]

# OAuth2 authentication
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

TokenDep = Annotated[str, Depends(reusable_oauth2)]


# User authentication dependencies
def get_current_user(session: SessionDep, token: TokenDep) -> User:
    """Get current authenticated user from JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY.get_secret_value(),
            algorithms=[security.ALGORITHM],
        )
        token_data = TokenPayload.model_validate(payload)
    except (jwt.InvalidTokenError, ValidationError):
        raise InvalidCredentials()
    if token_data.sub is None:
        raise InvalidCredentials()
    user = session.get(User, token_data.sub)
    if not user:
        raise UserNotFound()
    if not user.is_active:
        raise InactiveUser()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# Authorization dependencies
def get_current_active_superuser(current_user: CurrentUser) -> User:
    """Verify current user is a superuser."""
    if not current_user.is_superuser:
        raise InsufficientPrivileges()
    return current_user


CurrentSuperuser = Annotated[User, Depends(get_current_active_superuser)]


# Resource dependencies
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


def verify_label_image_limit(session: SessionDep, label: LabelDep) -> Label:
    """Verify label hasn't reached max image limit."""
    # Lock the label row to prevent concurrent modifications
    locked_label_stmt = select(Label).where(Label.id == label.id).with_for_update()
    locked_label = session.execute(locked_label_stmt).scalar_one()

    count_stmt = (
        select(func.count())
        .select_from(LabelImage)
        .where(LabelImage.label_id == label.id)
    )
    count_result = session.execute(count_stmt)
    current_count = count_result.scalar_one()
    if current_count >= settings.MAX_IMAGES_PER_LABEL:
        raise ImageCountLimitExceeded(
            current_count=current_count,
            requested_count=1,
            max_count=settings.MAX_IMAGES_PER_LABEL,
        )
    return locked_label


LabelWithImageLimitDep = Annotated[Label, Depends(verify_label_image_limit)]


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
        raise LabelImageNotFound(
            f"Pending LabelImage not found for path: {request.storage_file_path}"
        )
    return label_image


PendingLabelImageDep = Annotated[LabelImage, Depends(get_pending_label_image)]


async def verify_file_exists_in_storage(
    s3_client: S3ClientDep,
    label_image: PendingLabelImageDep,
) -> LabelImage:
    """Verify file exists in storage or raise 404."""
    if not await file_exists(s3_client, label_image.file_path):
        raise FileNotFoundInStorage(
            f"File not found in storage: {label_image.file_path}"
        )
    return label_image


VerifiedLabelImageDep = Annotated[LabelImage, Depends(verify_file_exists_in_storage)]


def get_label_image_by_id(
    session: SessionDep,
    label: LabelDep,
    image_id: UUID,
) -> LabelImage:
    """Get LabelImage by ID, verify it belongs to label, or raise 404."""
    stmt = select(LabelImage).where(
        LabelImage.id == image_id,
        LabelImage.label_id == label.id,
    )
    result = session.execute(stmt)
    label_image = result.scalar_one_or_none()
    if not label_image:
        raise LabelImageNotFound(
            f"LabelImage {image_id} not found for label {label.id}"
        )
    return label_image


LabelImageDep = Annotated[LabelImage, Depends(get_label_image_by_id)]


def verify_label_image_completed(label_image: LabelImageDep) -> LabelImage:
    """Verify LabelImage is completed or raise 400."""
    if label_image.status != UploadStatus.completed:
        raise ImageNotCompleted()
    return label_image


CompletedLabelImageDep = Annotated[LabelImage, Depends(verify_label_image_completed)]
