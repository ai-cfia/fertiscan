import asyncio
from collections.abc import Sequence
from typing import Any
from uuid import UUID

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from instructor import AsyncInstructor
from pydantic import validate_call
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.label import Label, ReviewStatus
from app.db.models.label_data import LabelData
from app.db.models.non_compliance_data_item import NonComplianceDataItem
from app.db.models.requirement import Requirement

# from app.db.models.rule import Rule
from app.evaluators.base import RuleEvaluator
from app.schemas.label import ComplianceResult, LabelUpdate
from app.storage import delete_files


def _apply_label_sorting(
    stmt: SelectOfScalar[Label],
    order_by: str,
    order: str,
) -> SelectOfScalar[Label]:
    """Apply sorting to labels query."""
    valid_sort_fields: dict[str, Any] = {
        "id": Label.id,
        "created_at": Label.created_at,
        "createdAt": Label.created_at,
        "review_status": Label.review_status,
        "reviewStatus": Label.review_status,
        "brand_name_en": func.coalesce(
            LabelData.brand_name_en,
            LabelData.brand_name_fr,
        ),
        "brand_name_fr": func.coalesce(
            LabelData.brand_name_fr,
            LabelData.brand_name_en,
        ),
        "product_name_en": func.coalesce(
            LabelData.product_name_en,
            LabelData.product_name_fr,
        ),
        "product_name_fr": func.coalesce(
            LabelData.product_name_fr,
            LabelData.product_name_en,
        ),
    }
    sort_column: Any = valid_sort_fields.get(order_by, Label.created_at)

    needs_label_data = order_by in (
        "brand_name_en",
        "brand_name_fr",
        "product_name_en",
        "product_name_fr",
    )
    if needs_label_data:
        stmt = stmt.outerjoin(LabelData, Label.id == LabelData.label_id)  # type: ignore[arg-type]
    if order.lower() == "asc":
        stmt = stmt.order_by(sort_column.asc())
    else:
        stmt = stmt.order_by(sort_column.desc())
    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
def create_label(
    session: Session,
    user_id: UUID,
    product_type_id: UUID,
    product_id: UUID | None = None,
) -> Label:
    label = Label(
        product_type_id=product_type_id,
        created_by_id=user_id,
        product_id=product_id,
    )
    session.add(label)
    session.flush()
    session.refresh(label)
    return label


@validate_call(config={"arbitrary_types_allowed": True})
def get_labels_query(
    user_id: UUID,  # noqa: ARG001
    product_type_id: UUID,
    review_status: ReviewStatus | None = None,
    unlinked: bool | None = None,
    order_by: str = "created_at",
    order: str = "desc",
) -> SelectOfScalar[Label]:
    """Build labels query with optional filters and sorting."""
    stmt = select(Label).where(Label.product_type_id == product_type_id)
    if review_status is not None:
        stmt = stmt.where(Label.review_status == review_status)
    if unlinked is True:
        stmt = stmt.where(Label.product_id == None)  # noqa: E711
    stmt = _apply_label_sorting(stmt, order_by, order)
    stmt = stmt.options(selectinload(Label.label_data))  # type: ignore[arg-type]
    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
async def get_label_detail(
    session: Session,
    label: Label,
) -> Label:
    """Get label detail with images, product_type, and created_by relationships
    loaded."""
    stmt = (
        select(Label)
        .where(Label.id == label.id)
        .options(
            selectinload(Label.images),  # type: ignore[arg-type]
            selectinload(Label.product_type),  # type: ignore[arg-type]
            selectinload(Label.created_by),  # type: ignore[arg-type]
        )
    )
    return session.exec(stmt).one()


@validate_call(config={"arbitrary_types_allowed": True})
def update_label(
    session: Session,
    label: Label,
    label_in: LabelUpdate,
) -> Label:
    """Partial update Label fields (excluding review_status)."""
    update_data = label_in.model_dump(exclude_unset=True)
    label.sqlmodel_update(update_data)
    session.add(label)
    session.flush()
    session.refresh(label)
    return label


@validate_call(config={"arbitrary_types_allowed": True})
def update_label_review_status(
    session: Session,
    label: Label,
    new_status: ReviewStatus,
) -> Label:
    """Update Label review_status (allowed even when completed)."""
    label.review_status = new_status
    session.add(label)
    session.flush()
    session.refresh(label)
    return label


@validate_call(config={"arbitrary_types_allowed": True})
async def delete_label(
    session: Session,
    s3_client: AioBaseClient,
    label: Label,
) -> None:
    """Delete a label and its associated storage files."""
    file_paths = [img.file_path for img in label.images]
    if file_paths:
        await delete_files(s3_client, file_paths)
    session.delete(label)
    session.flush()


@validate_call(config={"arbitrary_types_allowed": True})
async def evaluate_non_compliance(
    session: Session,
    instructor: AsyncInstructor,
    label: Label,
    rules: Sequence[Requirement],
) -> dict[UUID, ComplianceResult]:
    """Evaluate rules in parallel."""

    tasks = []
    requirement_ids = []

    for rule in rules:
        if ev := RuleEvaluator.get_evaluator(rule, session, instructor):
            tasks.append(ev.evaluate(label))
            requirement_ids.append(rule.id)

    results = await asyncio.gather(*tasks)
    return dict(zip(requirement_ids, results, strict=True))


@validate_call(config={"arbitrary_types_allowed": True})
def update_is_compliant(
    session: Session,
    label: Label,
    is_compliant: bool,
    requirement: Requirement,
) -> Label:
    """Update or create non-compliance data item."""
    stmt = select(NonComplianceDataItem).where(
        NonComplianceDataItem.requirement_id == requirement.id,
        NonComplianceDataItem.label_id == label.id,
    )
    non_compliance_data_item = session.scalars(stmt).first()

    if non_compliance_data_item is None:
        non_compliance_data_item = NonComplianceDataItem(
            label_id=label.id,
            requirement_id=requirement.id,
            description_en=requirement.description_en,
            description_fr=requirement.description_fr,
            is_compliant=is_compliant,
        )
        session.add(non_compliance_data_item)
    else:
        non_compliance_data_item.is_compliant = is_compliant
        session.add(non_compliance_data_item)

    session.flush()
    session.refresh(label)
    return label
