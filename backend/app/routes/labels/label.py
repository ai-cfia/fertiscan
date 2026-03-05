"""Label routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi_pagination import LimitOffsetPage
from fastapi_pagination.ext.sqlmodel import paginate
from pydantic import StringConstraints

from app.controllers import compliance as compliance_controller
from app.controllers.labels import label as label_controller
from app.db.models import ReviewStatus
from app.dependencies import (
    CompletedLabelDep,
    CurrentUser,
    EditableLabelDep,
    InstructorDep,
    LabelDep,
    LimitOffsetParamsDep,
    NonComplianceDataItemDep,
    ProductQueryTypeDep,
    ProductTypeDep,
    RequirementsDep,
    S3ClientDep,
    SessionDep,
    ValidatedStatusLabelDep,
    newComplianceDataItemDep,
)
from app.exceptions import InvalidDateRange
from app.schemas.label import (
    ComplianceResults,
    LabelCreate,
    LabelCreated,
    LabelDetail,
    LabelListItem,
    LabelReviewStatusUpdate,
    LabelUpdate,
)
from app.schemas.message import Message
from app.schemas.non_compliance_data_item import (
    NonComplianceDataItemParams,
    NonComplianceDataItemPublic,
    UpdateNonComplianceDataItemPayload,
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
    return paginate(session, stmt, params)  # type: ignore[no-any-return, arg-type]


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


@router.get("/{label_id}/evaluate-non-compliance", response_model=ComplianceResults)
async def evaluate_non_compliance(
    label: CompletedLabelDep,
    _: CurrentUser,
    instructor: InstructorDep,
    requirements: RequirementsDep,
) -> ComplianceResults:
    """Evaluate non-compliance of the label against specified rules."""
    results = await label_controller.evaluate_non_compliance(
        instructor=instructor,
        label=label,
        rules=requirements,
    )

    return ComplianceResults(
        total=len(results),
        results=results,
    )


# =========================================CRUD for compliances===============================


@router.post(
    "/{label_id}/non_compliance_data_items", response_model=NonComplianceDataItemPublic
)
def create_compliance(
    session: SessionDep,
    _: CurrentUser,
    compliance_data_item: newComplianceDataItemDep,
) -> NonComplianceDataItemPublic:
    """Create a new compliance result."""
    return compliance_controller.create_compliance(  # type: ignore[return-value]
        session=session,
        compliance_data_item=compliance_data_item,
    )


@router.get(
    "/{label_id}/non_compliance_data_items",
    response_model=LimitOffsetPage[NonComplianceDataItemPublic],
)
def reads_compliances(
    session: SessionDep,
    _: CurrentUser,
    label: LabelDep,
    params: LimitOffsetParamsDep,
    filters: NonComplianceDataItemParams = Depends(),
) -> LimitOffsetPage[NonComplianceDataItemPublic]:
    """Read compliance results for a label with optional filters."""

    if filters.start_created_at and filters.end_created_at:
        if filters.start_created_at > filters.end_created_at:
            raise InvalidDateRange()

    if filters.start_updated_at and filters.end_updated_at:
        if filters.start_updated_at > filters.end_updated_at:
            raise InvalidDateRange()

    stmt = compliance_controller.get_compliances_query(
        label_id=label.id,
        **filters.model_dump(),
    )
    return paginate(session, stmt, params)  # type: ignore[no-any-return, arg-type]


@router.get(
    "/{label_id}/non_compliance_data_items/{requirement_id}",
    response_model=NonComplianceDataItemPublic,
)
def read_compliance_by_rule(
    _: CurrentUser,
    nonComplianceItem: NonComplianceDataItemDep,
) -> NonComplianceDataItemPublic:
    """Read compliance result for a label and a specific rule."""

    return nonComplianceItem  # type: ignore[return-value]


@router.patch(
    "/{label_id}/non_compliance_data_items/{requirement_id}",
    response_model=NonComplianceDataItemPublic,
)
def update_compliance(
    session: SessionDep,
    _: CurrentUser,
    nonComplianceItem: NonComplianceDataItemDep,
    compliance_data_items_in: UpdateNonComplianceDataItemPayload,
) -> NonComplianceDataItemPublic:
    """Update a non-compliance data item for a given label and rule."""
    return compliance_controller.update_compliance(  # type: ignore[return-value]
        session=session,
        nonComplianceDataItem=nonComplianceItem,
        compliance_data_items_in=compliance_data_items_in,
    )


@router.delete(
    "/{label_id}/non_compliance_data_items/{requirement_id}", response_model=Message
)
def delete_compliance(
    session: SessionDep,
    _: CurrentUser,
    nonComplianceItem: NonComplianceDataItemDep,
) -> Message:
    """Delete a non-compliance data item for a given label and rule."""

    compliance_controller.delete_compliance(
        session=session,
        nonComplianceDataItem=nonComplianceItem,
    )

    return Message(message="Compliance data item deleted successfully")
