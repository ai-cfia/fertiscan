"""Controller of compliance"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import validate_call
from sqlalchemy import func
from sqlmodel import Session, or_, select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.enums import ComplianceStatus
from app.db.models.non_compliance_data_item import NonComplianceDataItem
from app.schemas.non_compliance_data_item import (
    UpdateNonComplianceDataItemPayload,
)


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


def _apply_compliance_sorting(
    stmt: SelectOfScalar[NonComplianceDataItem],
    order_by: str,
    order: str,
) -> SelectOfScalar[NonComplianceDataItem]:
    """Apply sorting to a compliances query."""

    valid_sort_fields: dict[str, Any] = {
        "id": NonComplianceDataItem.id,
        "created_at": NonComplianceDataItem.created_at,
        "createdAt": NonComplianceDataItem.created_at,
        "updated_at": NonComplianceDataItem.updated_at,
        "updatedAt": NonComplianceDataItem.updated_at,
        "status": NonComplianceDataItem.status,
        "note": func.coalesce(
            NonComplianceDataItem.note,
            "",
        ),
    }

    sort_column: Any = valid_sort_fields.get(order_by, NonComplianceDataItem.created_at)

    if order.lower() == "asc":
        stmt = stmt.order_by(sort_column.asc())
    else:
        stmt = stmt.order_by(sort_column.desc())
    return stmt


# TODO: Update this controller to be good with the new dependencies system and ensure it works with the updated label and requirement models
@validate_call(config={"arbitrary_types_allowed": True})
def get_compliances_query(
    label_id: UUID,
    note: str | None = None,
    description_en: str | None = None,
    description_fr: str | None = None,
    status: ComplianceStatus | None = None,
    start_created_at: datetime | None = None,
    end_created_at: datetime | None = None,
    start_updated_at: datetime | None = None,
    end_updated_at: datetime | None = None,
    order_by: str = "created_at",
    order: str = "desc",
) -> SelectOfScalar[NonComplianceDataItem]:
    """Get compliance results for a given label with optionnal filters."""

    stmt = select(NonComplianceDataItem).where(
        NonComplianceDataItem.label_id == label_id
    )
    search_conditions = []
    # Identity Search Attributes (Grouped OR)
    if note:
        search_conditions.append(NonComplianceDataItem.note.ilike(f"%{note}%"))  # type: ignore[union-attr]
    if description_en:
        search_conditions.append(
            NonComplianceDataItem.description_en.ilike(f"%{description_en}%")  # type: ignore[union-attr]
        )
    if description_fr:
        search_conditions.append(
            NonComplianceDataItem.description_fr.ilike(f"%{description_fr}%")  # type: ignore[union-attr]
        )
    if status is not None:
        search_conditions.append(NonComplianceDataItem.status == status)

    if search_conditions:
        stmt = stmt.where(or_(*search_conditions))

    # Strict Metadata Filters (AND)
    # Filter by start created at
    if start_created_at:
        stmt = stmt.where(NonComplianceDataItem.created_at >= start_created_at)  # type: ignore[operator]

    # Filter by end created at
    if end_created_at:
        stmt = stmt.where(NonComplianceDataItem.created_at <= end_created_at)  # type: ignore[operator]

    # Filter by start updated
    if start_updated_at:
        stmt = stmt.where(NonComplianceDataItem.updated_at >= start_updated_at)  # type: ignore[operator]

    # Filter by end updated at
    if end_updated_at:
        stmt = stmt.where(NonComplianceDataItem.updated_at <= end_updated_at)  # type: ignore[operator]

    stmt = _apply_compliance_sorting(stmt, order_by, order)
    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
def update_compliance(
    session: Session,
    nonComplianceDataItem: NonComplianceDataItem,
    compliance_data_items_in: UpdateNonComplianceDataItemPayload,
) -> NonComplianceDataItem:
    """Update a non-compliance data item."""

    for field, value in compliance_data_items_in.model_dump(exclude_unset=True).items():
        setattr(nonComplianceDataItem, field, value)

    session.add(nonComplianceDataItem)
    session.flush()
    session.refresh(nonComplianceDataItem)
    return nonComplianceDataItem


@validate_call(config={"arbitrary_types_allowed": True})
def delete_compliance(
    session: Session,
    nonComplianceDataItem: NonComplianceDataItem,
) -> None:
    """Delete a non-compliance data item."""
    session.delete(nonComplianceDataItem)
    session.flush()
