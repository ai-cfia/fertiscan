"""Label routes."""

from fastapi import APIRouter, Depends, Query
from fastapi_pagination import LimitOffsetPage, LimitOffsetParams
from fastapi_pagination.ext.sqlmodel import paginate

from app.controllers import labels as label_controller
from app.db.models.label import ExtractionStatus, VerificationStatus
from app.dependencies import CurrentUser, SessionDep
from app.schemas.label import LabelPublic

router = APIRouter(prefix="/labels", tags=["labels"])


# ============================== CRUD ==============================
@router.get("", response_model=LimitOffsetPage[LabelPublic])
def read_labels(
    session: SessionDep,
    current_user: CurrentUser,
    params: LimitOffsetParams = Depends(),
    product_type: str = Query(default="fertilizer", description="Product type"),
    verification_status: VerificationStatus | None = Query(
        default=None, description="Filter by verification status"
    ),
    extraction_status: ExtractionStatus | None = Query(
        default=None, description="Filter by extraction status"
    ),
    unlinked: bool | None = Query(
        default=None, description="Filter unlinked labels only (product_id is null)"
    ),
) -> LimitOffsetPage[LabelPublic]:
    """List labels with optional filters."""
    stmt = label_controller.get_labels_query(
        user_id=current_user.id,
        product_type=product_type,
        verification_status=verification_status,
        extraction_status=extraction_status,
        unlinked=unlinked,
    )
    return paginate(session, stmt, params)  # type: ignore[no-any-return, call-overload]
