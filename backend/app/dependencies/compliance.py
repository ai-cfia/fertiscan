"""Dependencies for compliance routes"""

from typing import Annotated

from fastapi import Depends
from sqlmodel import select

from app.db.models.non_compliance_data_item import NonComplianceDataItem
from app.dependencies.auth import SessionDep
from app.dependencies.labels import LabelDep
from app.dependencies.rule import RuleDep, get_rule_by_id
from app.exceptions import (
    NonComplianceDataItemAlreadyExists,
    NonComplianceDataItemNotFound,
)
from app.schemas.non_compliance_data_item import NonComplianceDataItemPayload


def ensure_Label_Has_No_Non_Compliance_Data(
    label: LabelDep,
    payload: NonComplianceDataItemPayload,
    session: SessionDep,
) -> NonComplianceDataItem:
    """Ensure that a label has no non-compliance data for a given rule."""

    rule = get_rule_by_id(payload.rule_id, session)

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


def get_non_compliance_data_item_by_label_and_rule(
    label: LabelDep,
    rule: RuleDep,
    session: SessionDep,
) -> NonComplianceDataItem:
    """Get non-compliance data item for a given label and rule."""

    stmt = select(NonComplianceDataItem).where(
        NonComplianceDataItem.rule_id == rule.id,
        NonComplianceDataItem.label_id == label.id,
    )
    result = session.scalars(stmt).first()
    if result is None:
        raise NonComplianceDataItemNotFound(label_id=label.id, rule_id=rule.id)

    return result


NonComplianceDataItemDep = Annotated[
    NonComplianceDataItem, Depends(get_non_compliance_data_item_by_label_and_rule)
]
