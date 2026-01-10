"""Label CRUD operations."""

from uuid import UUID

from pydantic import validate_call
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.label import ExtractionStatus, Label, VerificationStatus
from app.db.models.product_type import ProductType


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
