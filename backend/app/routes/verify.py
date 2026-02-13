"""Routes for verifying non-compliance data items of a label."""

from typing import cast
from uuid import UUID

from fastapi import APIRouter
from fastapi_pagination import LimitOffsetPage, paginate

from app.controllers import products as product_controller
from app.controllers import verify as verify_controller
from app.db.models.label import Label, ReviewStatus
from app.dependencies import (
    CurrentUser,
    SessionDep,
)
from app.exceptions import LabelNotCompletedError, LabelNotFound, ProductNotFound
from app.schemas.non_compliance_data_item import NonComplianceDataItemPublic

router = APIRouter(prefix="/verify", tags=["verify"])

# ============================== CRUD ==============================


@router.get("/{label_id}", response_model=LimitOffsetPage[NonComplianceDataItemPublic])
def verify_rule(
    label_id: UUID,
    session: SessionDep,
    __: CurrentUser,
) -> LimitOffsetPage[NonComplianceDataItemPublic]:
    """Verify non-compliance data item of the label."""

    label = session.get(Label, label_id)
    if not label:
        raise LabelNotFound()
    if label.review_status != ReviewStatus.completed:
        raise LabelNotCompletedError()

    if not label.product_id:
        raise ProductNotFound()
    if not (product := product_controller.get_product_by_id(session, label.product_id)):
        raise ProductNotFound()

    non_compliance_data_items = verify_controller.verify_product(
        session, label_id, product
    )
    return cast(
        LimitOffsetPage[NonComplianceDataItemPublic],
        paginate(non_compliance_data_items),  # type: ignore[arg-type]
    )
