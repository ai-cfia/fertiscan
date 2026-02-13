"""Controller of verification of a product."""

from pydantic import validate_call
from sqlalchemy.orm import Session
from sqlmodel import select

from app.db.models.label import Label
from app.db.models.label_data import LabelData
from app.db.models.non_compliance_data_item import NonComplianceDataItem
from app.db.models.rule import Rule

# ======================================General verification function for a label======================================


@validate_call(config={"arbitrary_types_allowed": True})
def verify_all_rules(session: Session, label: Label) -> Label:
    """Verify non-compliance data item of the label.
    All verifications should be addded in this function.

    Template for adding new verification:

    session = update_is_compliant(
        is_compliant=verification_lot_number(label_data),
        reference_number="Reference number of the rule",
        session=session,
        label=label,
    )
    """

    assert label.label_data is not None
    label = update_is_compliant(
        is_compliant=verification_lot_number(label.label_data),
        rule=get_rule_by_reference_number("FzR: 16.(1)(j)", session=session),
        session=session,
        label=label,
    )

    return label


# ======================================Update or create non-compliance data item======================================
@validate_call(config={"arbitrary_types_allowed": True})
def update_is_compliant(
    session: Session,
    label: Label,
    is_compliant: bool,
    rule: Rule,
) -> Label:
    """Update the is_compliant field of the non-compliance data item if the
    non-compliance data item already exists, otherwise create a new
    non-compliance data item."""

    stmt = select(NonComplianceDataItem).where(
        NonComplianceDataItem.rule_id == rule.id,
        NonComplianceDataItem.label_id == label.id,
    )
    non_compliance_data_item = session.scalars(stmt).first()

    if non_compliance_data_item is None:
        non_compliance_data_item = NonComplianceDataItem(
            label_id=label.id,
            rule_id=rule.id,
            description_en=rule.description_en,
            description_fr=rule.description_fr,
            is_compliant=is_compliant,
        )

        session.add(non_compliance_data_item)
        session.flush()
        session.refresh(label)
        return label

    non_compliance_data_item.is_compliant = is_compliant
    session.add(non_compliance_data_item)
    session.flush()
    session.refresh(label)
    return label


# ============================= Ordinary function of getter =====================================================
@validate_call(config={"arbitrary_types_allowed": True})
def get_rule_by_reference_number(
    reference_number: str,
    session: Session,
) -> Rule:
    """Get the rule with the given reference number."""
    stmt = select(Rule).where(Rule.reference_number == reference_number)
    rule = session.scalars(stmt).first()
    assert rule is not None, f"Rule with reference number {reference_number} not found"
    return rule


# ======================================Verification functions for each rule======================================
@validate_call(config={"arbitrary_types_allowed": True})
def verification_lot_number(label_data: LabelData) -> bool:
    """Verify if the lot number is present in the label data."""
    lot_number_data = label_data.lot_number

    if lot_number_data is None:
        return False

    if isinstance(lot_number_data, str):
        return bool(lot_number_data.strip())

    return True
