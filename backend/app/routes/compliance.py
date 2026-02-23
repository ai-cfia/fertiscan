"""Route for compliance"""

from fastapi import APIRouter

# from fastapi_pagination import LimitOffsetPage
# from fastapi_pagination.ext.sqlmodel import paginate
from app.controllers import compliance as compliance_controller
from app.dependencies import (
    CurrentUser,
    SessionDep,
    newComplianceDataItemDep,
)
from app.schemas.non_compliance_data_item import NonComplianceDataItemPublic

router = APIRouter(prefix="/compliances", tags=["compliances"])


@router.post("", response_model=NonComplianceDataItemPublic)
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
