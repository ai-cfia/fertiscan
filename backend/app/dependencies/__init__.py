"""FastAPI dependency injection."""

from app.dependencies.compliance import (
    NonComplianceDataItemDep,
    newComplianceDataItemDep,
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
    CompletedLabelDep,
    EditableLabelDep,
    EvaluableLabelDep,
    ExtractableLabelDep,
    FertilizerLabelDep,
    LabelDep,
    LabelWithoutDataDep,
    LabelWithoutFertilizerDataDep,
    S3ClientDep,
    UploadableLabelDep,
    ValidatedStatusLabelDep,
)
from app.dependencies.pagination import LimitOffsetParamsDep
from app.dependencies.product_types import (
    ProductCreateTypeDep,
    ProductQueryTypeDep,
    ProductTypeDep,
)
from app.dependencies.products import NewProductDep, ProductDep
from app.dependencies.requirement import RequirementDep, RequirementsDep
from app.dependencies.session import SessionDep
from app.dependencies.users import (
    CurrentSuperuser,
    CurrentUser,
    LoginUserDep,
    PrivateUserCreateDep,
    TokenDep,
    UserByEmailDep,
    UserCreateDep,
    UserDep,
    UserForResetPasswordDep,
    UserForUpdateByIdDep,
    UserForUpdateMeDep,
    UserForUpdatePasswordDep,
    ValidatedUserParamsDep,
)

__all__ = [
    "CompletedLabelImageDep",
    "CurrentSuperuser",
    "CurrentUser",
    "EditableLabelDep",
    "EditableLabelImageDep",
    "EvaluableLabelDep",
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
    "NewProductDep",
    "ProductDep",
    "ProductTypeDep",
    "ProductQueryTypeDep",
    "S3ClientDep",
    "SessionDep",
    "StoredPendingImageDep",
    "TokenDep",
    "UploadableLabelDep",
    "ValidatedStatusLabelDep",
    "CompletedLabelDep",
    "newComplianceDataItemDep",
    "NonComplianceDataItemDep",
    "RequirementDep",
    "RequirementsDep",
    "ValidatedUserParamsDep",
    "UserForUpdateByIdDep",
    "UserForUpdateMeDep",
    "UserForUpdatePasswordDep",
    "UserForResetPasswordDep",
    "LoginUserDep",
    "PrivateUserCreateDep",
    "UserCreateDep",
    "UserDep",
    "UserByEmailDep",
]
