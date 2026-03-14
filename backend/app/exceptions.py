"""HTTP exceptions."""

from uuid import UUID

from fastapi import HTTPException, status


class InvalidCredentials(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, "Could not validate credentials")


class UserNotFound(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, "User not found")


class UserWithEmailNotFound(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status.HTTP_404_NOT_FOUND,
            "The user with this email does not exist in the system.",
        )


class InactiveUser(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "Inactive user")


class InsufficientPrivileges(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, "Insufficient privileges")


class EmailAlreadyRegistered(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "Email already registered")


class UserAlreadyExists(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "User already exists")


class UserHasNoPassword(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "User has no password")


class IncorrectPassword(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "Incorrect password")


class IncorrectEmailOrPassword(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "Incorrect email or password")


class InvalidToken(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "Invalid token")


class LabelNotFound(HTTPException):
    def __init__(self, label_id: str | None = None) -> None:
        detail = f"Label {label_id} not found" if label_id else "Label not found"
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class ProductTypeNotFound(HTTPException):
    def __init__(self, code: str | None = None) -> None:
        detail = (
            f"Product type '{code}' not found" if code else "Product type not found"
        )
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class InactiveProductType(HTTPException):
    def __init__(self, code: str | None = None) -> None:
        detail = (
            f"Product type '{code}' is inactive" if code else "Product type is inactive"
        )
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class InvalidProductType(HTTPException):
    def __init__(self, detail: str = "Invalid product type") -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class ImageCountLimitExceeded(HTTPException):
    def __init__(
        self,
        current_count: int,
        requested_count: int,
        max_count: int,
    ) -> None:
        detail = f"Maximum {max_count} images per label. Current: {current_count}, requested: {requested_count}"
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class LabelImageNotFound(HTTPException):
    def __init__(self, detail: str = "LabelImage not found") -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class FileNotFoundInStorage(HTTPException):
    def __init__(self, detail: str = "File not found in storage") -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class ImageNotCompleted(HTTPException):
    def __init__(
        self,
        detail: str = "Presigned download URL can only be generated for completed images",
    ) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class ResourceConflict(HTTPException):
    def __init__(self, detail: str = "Resource already exists") -> None:
        super().__init__(status.HTTP_409_CONFLICT, detail)


class LabelCompleted(HTTPException):
    def __init__(self, detail: str = "Label is completed and cannot be edited") -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class LabelDataNotFound(HTTPException):
    def __init__(self, detail: str = "Label data not found") -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class FertilizerLabelDataNotFound(HTTPException):
    def __init__(
        self, detail: str = "Fertilizer label data not found for fertilizer product"
    ) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class RegistrationNumberMissing(HTTPException):
    def __init__(
        self, detail: str = "Registration number missing from label data"
    ) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class ProductNotFound(HTTPException):
    def __init__(self, product_id: str | UUID | None = None) -> None:
        detail = f"Product {product_id or ''} not found"
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class LabelNotLinkedToProduct(HTTPException):
    def __init__(self, label_id: str | UUID | None = None) -> None:
        detail = f"Label {label_id or ''} must be linked to a product before completion"
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class InvalidDateRange(HTTPException):
    def __init__(self, detail: str = "Invalid date range") -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class LabelNotCompletedError(HTTPException):
    def __init__(self, detail: str = "Label is not completed") -> None:
        super().__init__(status.HTTP_412_PRECONDITION_FAILED, detail)


class RuleNotFound(HTTPException):
    def __init__(self, rule_id: str | None = None) -> None:
        detail = f"Rule with id {rule_id} not found" if rule_id else "Rule not found"
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class RequirementNotFound(HTTPException):
    def __init__(self, requirement_id: str | None = None) -> None:
        detail = (
            f"Requirement with id {requirement_id} not found"
            if requirement_id
            else "Requirement not found"
        )
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class NonComplianceDataItemAlreadyExists(HTTPException):
    def __init__(
        self,
        label_id: str | UUID | None = None,
        requirement_id: str | UUID | None = None,
    ) -> None:
        detail = f"Non-compliance data item already exists for label {label_id} and requirement {requirement_id}"
        super().__init__(status.HTTP_409_CONFLICT, detail)


class NonComplianceDataItemNotFound(HTTPException):
    def __init__(
        self,
        label_id: str | UUID | None = None,
        requirement_id: str | UUID | None = None,
    ) -> None:
        detail = f"Non-compliance data item not found for label {label_id} and requirement {requirement_id}"
        super().__init__(status.HTTP_404_NOT_FOUND, detail)
