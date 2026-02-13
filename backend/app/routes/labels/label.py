"""Label routes."""

from typing import Annotated

from fastapi import APIRouter, Query, status
from fastapi_pagination import LimitOffsetPage
from fastapi_pagination.ext.sqlmodel import paginate
from pydantic import StringConstraints

from app.controllers import labels as label_controller
from app.controllers import products as product_controller
from app.controllers import verify as verify_controller
from app.db.models.label import ReviewStatus
from app.dependencies import (
    CurrentUser,
    EditableLabelDep,
    LabelDep,
    LimitOffsetParamsDep,
    ProductQueryTypeDep,
    ProductTypeDep,
    S3ClientDep,
    SessionDep,
    ValidatedStatusLabelDep,
)
<<<<<<< 358-lot-number-verification
from app.exceptions import (
    LabelDataNotFound,
    LabelNotCompletedError,
    ProductNotFound,
    RegistrationNumberMissing,
)
=======
>>>>>>> 257-restructure-datastore
from app.schemas.label import (
    LabelCreate,
    LabelCreated,
    LabelDetail,
    LabelListItem,
    LabelReviewStatusUpdate,
    LabelUpdate,
    NonComplianceDataItemsList,
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
    params: LimitOffsetParamsDep,
    product_type: ProductQueryTypeDep,
    review_status: ReviewStatus | None = Query(
        default=None, description="Filter by review status"
    ),
    unlinked: bool | None = Query(
        default=None,
        description="Filter labels not linked to a product (product_id is null)",
    ),
    order_by: Annotated[str, StringConstraints(strip_whitespace=True)] = Query(
        default="created_at", description="Field to sort by"
    ),
    order: Annotated[str, StringConstraints(strip_whitespace=True)] = Query(
        default="desc", description="Sort direction (asc or desc)"
    ),
) -> LimitOffsetPage[LabelListItem]:
    """List labels with optional filters and sorting."""
    stmt = label_controller.get_labels_query(
        user_id=current_user.id,
        product_type_id=product_type.id,
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


@router.patch("/{label_id}", response_model=LabelDetail)
async def update_label(
    session: SessionDep,
    _: CurrentUser,
    label: EditableLabelDep,
    label_in: LabelUpdate,
) -> LabelDetail:
    """Update Label (partial update, excludes review_status)."""
    return label_controller.update_label(  # type: ignore[return-value]
        session=session,
        label=label,
        label_in=label_in,
    )


@router.patch("/{label_id}/review-status", response_model=LabelDetail)
async def update_label_review_status(
    session: SessionDep,
    _: CurrentUser,
    label: ValidatedStatusLabelDep,
    status_in: LabelReviewStatusUpdate,
) -> LabelDetail:
    """Update Label review_status (allowed even when completed)."""
    return label_controller.update_label_review_status(  # type: ignore[return-value]
        session=session,
        label=label,
        new_status=status_in.review_status,
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


@router.get("/{label_id}/verify", response_model=NonComplianceDataItemsList)
def verify_rule(
    label: LabelDep,
    session: SessionDep,
    __: CurrentUser,
) -> NonComplianceDataItemsList:
    """Verify non-compliance data item of the label."""

    if label.review_status != ReviewStatus.completed:
        raise LabelNotCompletedError()

    if not label.product_id:
        raise ProductNotFound()
    if not (product := product_controller.get_product_by_id(session, label.product_id)):
        raise ProductNotFound()

    return verify_controller.verify_product(session, label, product)
