"""FastAPI dependency injection."""

from app.dependencies.auth import (
    CurrentSuperuser,
    CurrentUser,
    SessionDep,
    TokenDep,
)
from app.dependencies.fertilizer_label_data import FertilizerLabelDataDep
from app.dependencies.instructor import InstructorDep
from app.dependencies.label_data import LabelDataDep
from app.dependencies.label_images import (
    CompletedLabelImageDep,
    LabelImageDep,
    LabelImageEditDep,
    VerifiedLabelImageDep,
)
from app.dependencies.labels import (
    FertilizerLabelDataNotExistsDep,
    FertilizerLabelDataNotExistsEditDep,
    FertilizerTypeLabelDep,
    FertilizerTypeLabelEditDep,
    FertilizerTypeLabelWithCompletedImagesDep,
    FertilizerTypeLabelWithCompletedImagesEditDep,
    LabelDataNotExistsDep,
    LabelDataNotExistsEditDep,
    LabelDep,
    LabelNotCompletedDep,
    LabelWithCompletedImagesDep,
    LabelWithImageLimitDep,
    LabelWithImageLimitEditDep,
    LabelWithImagesAndProductTypeDep,
    LabelWithProductForCompletionDep,
    ProductTypeDep,
    S3ClientDep,
)

__all__ = [
    "CompletedLabelImageDep",
    "CurrentSuperuser",
    "CurrentUser",
    "FertilizerLabelDataDep",
    "FertilizerLabelDataNotExistsDep",
    "FertilizerLabelDataNotExistsEditDep",
    "FertilizerTypeLabelDep",
    "FertilizerTypeLabelEditDep",
    "FertilizerTypeLabelWithCompletedImagesDep",
    "FertilizerTypeLabelWithCompletedImagesEditDep",
    "LabelDataDep",
    "LabelDataNotExistsDep",
    "LabelDataNotExistsEditDep",
    "LabelDep",
    "LabelImageDep",
    "LabelImageEditDep",
    "LabelNotCompletedDep",
    "LabelWithCompletedImagesDep",
    "LabelWithImageLimitDep",
    "LabelWithImageLimitEditDep",
    "LabelWithImagesAndProductTypeDep",
    "InstructorDep",
    "ProductTypeDep",
    "S3ClientDep",
    "SessionDep",
    "TokenDep",
    "VerifiedLabelImageDep",
    "LabelWithProductForCompletionDep",
]
