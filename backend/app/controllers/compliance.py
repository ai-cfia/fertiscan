"""Controller of compliance"""

from pydantic import validate_call
from sqlalchemy.orm import Session

from app.db.models.non_compliance_data_item import NonComplianceDataItem


@validate_call(config={"arbitrary_types_allowed": True})
def create_compliance(
    session: Session,
    compliance_data_item: NonComplianceDataItem,
) -> NonComplianceDataItem:
    """Create a compliance report for a given label."""

    session.add(compliance_data_item)

    session.flush()
    session.refresh(compliance_data_item)
    return compliance_data_item
