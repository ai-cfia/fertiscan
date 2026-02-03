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
    EditableLabelImageDep,
    LabelImageDep,
    StoredPendingImageDep,
)
from app.dependencies.labels import (
    CompletableLabelDep,
    EditableLabelDep,
    ExtractableLabelDep,
    FertilizerLabelDep,
    LabelDep,
    LabelWithoutDataDep,
    LabelWithoutFertilizerDataDep,
    S3ClientDep,
    UploadableLabelDep,
)
from app.dependencies.pagination import LimitOffsetParamsDep
from app.dependencies.product_types import (
    ProductCreateTypeDep,
    ProductQueryTypeDep,
    ProductTypeDep,
)
from app.dependencies.products import ProductDep, ProductRegistrationNumberUniqueDep

__all__ = [
    "CompletableLabelDep",
    "CompletedLabelImageDep",
    "CurrentSuperuser",
    "CurrentUser",
    "EditableLabelDep",
    "EditableLabelImageDep",
    "ExtractableLabelDep",
    "FertilizerLabelDataDep",
    "FertilizerLabelDep",
    "InstructorDep",
    "LabelDataDep",
    "LabelDep",
    "LabelImageDep",
    "LabelWithoutDataDep",
    "LabelWithoutFertilizerDataDep",
    "LimitOffsetParamsDep",
    "ProductCreateTypeDep",
    "ProductDep",
    "ProductRegistrationNumberUniqueDep",
    "ProductTypeDep",
    "ProductQueryTypeDep",
    "S3ClientDep",
    "SessionDep",
    "StoredPendingImageDep",
    "TokenDep",
    "UploadableLabelDep",
]
