from typing import cast
from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.label_data import LabelData
from app.db.models.non_compliance_data_item import NonComplianceDataItem
from app.db.models.product import Product
from app.db.models.rule import Rule

# ======================================General verification function for a product======================================


@validate_call(config={"arbitrary_types_allowed": True})
def verify_product(
    session: Session,
    label_id: UUID,
    _product: Product,
) -> SelectOfScalar[NonComplianceDataItem]:
    """Verify non-compliance data item of the label."""

    stmt = select(LabelData).where(LabelData.label_id == label_id)
    label_data = session.scalars(stmt).first()
    assert label_data is not None

    session = verification(session, label_data, _product)

    session.commit()
    stmt = select(NonComplianceDataItem).where(  # type: ignore[assignment]
        NonComplianceDataItem.label_id == label_id
    )

    non_compliance_data_items = session.scalars(stmt).all()

    return cast(SelectOfScalar[NonComplianceDataItem], non_compliance_data_items)


# ======================================Update or create non-compliance data item======================================
@validate_call(config={"arbitrary_types_allowed": True})
def update_is_compliant(
    is_compliant: bool, reference_number: str, session: Session, label_id: UUID
) -> Session:
    """Update the is_compliant field of the non-compliance data item if the
    non-compliance data item already exists, otherwise create a new
    non-compliance data item."""

    stmt = select(Rule).where(Rule.reference_number == reference_number)
    rule = session.scalars(stmt).first()
    if rule is None:
        return session

    stmt = select(NonComplianceDataItem).where(  # type: ignore[assignment]
        NonComplianceDataItem.rule_id == rule.id,
        NonComplianceDataItem.label_id == label_id,
    )
    non_compliance_data_item = session.scalars(stmt).first()

    if non_compliance_data_item is None:
        non_compliance_data_item = NonComplianceDataItem(  # type: ignore[assignment]
            label_id=label_id,
            rule_id=rule.id,
            description_en=rule.description_en,
            description_fr=rule.description_fr,
            is_compliant=is_compliant,
        )

        session.add(non_compliance_data_item)
        session.flush()
        return session

    non_compliance_data_item.is_compliant = is_compliant
    session.add(non_compliance_data_item)
    session.flush()
    return session


# ======================================Verification function to verify all rules======================================
@validate_call(config={"arbitrary_types_allowed": True})
def verification(session: Session, label_data: LabelData, _product: Product) -> Session:
    """All verifications should be addded in this function.

    Template for adding new verification:

    session = update_is_compliant(
        is_compliant=verification_lot_number(label_data),
        reference_number="Reference number of the rule",
        session=session,
        label_id=label_data.label_id,
    )
    """

    session = update_is_compliant(
        is_compliant=verification_lot_number(label_data),
        reference_number="FzR: 16.(1)(j)",
        session=session,
        label_id=label_data.label_id,
    )

    return session


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
