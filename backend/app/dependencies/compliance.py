"""Dependencies for compliance routes"""

from typing import Annotated

from fastapi import Depends
from sqlmodel import select

from app.db.models.non_compliance_data_item import NonComplianceDataItem
from app.dependencies.auth import SessionDep
from app.dependencies.labels import get_label_by_id
from app.dependencies.rule import get_rule_by_id
from app.exceptions import NonComplianceDataItemAlreadyExists
from app.schemas.non_compliance_data_item import NonComplianceDataItemCreate


def ensure_Label_Has_No_Non_Compliance_Data(
    session: SessionDep,
    payload: NonComplianceDataItemCreate,
) -> NonComplianceDataItem:
    """Ensure that a label has no non-compliance data for a given rule."""

    rule = get_rule_by_id(payload.rule_id, session)

    label = get_label_by_id(session, payload.label_id)

    stmt = select(NonComplianceDataItem).where(
        NonComplianceDataItem.rule_id == rule.id,
        NonComplianceDataItem.label_id == label.id,
    )
    non_compliance_data_item = session.scalars(stmt).first()

    if non_compliance_data_item is not None:
        raise NonComplianceDataItemAlreadyExists(label_id=label.id, rule_id=rule.id)

    return NonComplianceDataItem(
        label_id=label.id,
        rule_id=rule.id,
        is_compliant=payload.is_compliant,
        note=payload.note,
        description_en=payload.description_en,
        description_fr=payload.description_fr,
    )


newComplianceDataItemDep = Annotated[
    NonComplianceDataItem, Depends(ensure_Label_Has_No_Non_Compliance_Data)
]
