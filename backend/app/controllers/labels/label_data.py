"""LabelData CRUD operations."""

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session
from sqlmodel import select

from app.db.models import Label, ReviewStatus
from app.db.models.label_data import LabelData
from app.db.models.label_data_field_meta import LabelDataFieldMeta
from app.schemas.label_data import (
    LabelDataCreate,
    LabelDataFieldMetaUpdate,
    LabelDataUpdate,
)


@validate_call(config={"arbitrary_types_allowed": True})
def create_label_data(
    session: Session,
    label_id: UUID,
    data_in: LabelDataCreate,
) -> LabelData:
    """Create LabelData record."""
    label_data = LabelData(label_id=label_id, **data_in.model_dump(mode="json"))
    session.add(label_data)
    session.flush()
    session.refresh(label_data)
    return label_data


@validate_call(config={"arbitrary_types_allowed": True})
def get_label_data(
    session: Session,
    label_id: UUID,
) -> LabelData | None:
    """Fetch LabelData by label_id, return None if not found."""
    stmt = select(LabelData).where(LabelData.label_id == label_id)
    result = session.execute(stmt)
    return result.scalar_one_or_none()


@validate_call(config={"arbitrary_types_allowed": True})
def update_label_data(
    session: Session,
    label: Label,
    label_data: LabelData,
    data_in: LabelDataUpdate,
) -> LabelData:
    """Partial update LabelData fields."""
    if not (update_data := data_in.model_dump(exclude_unset=True, mode="json")):
        return label_data
    label_data.sqlmodel_update(update_data)
    # Auto-transition Label review_status from not_started → in_progress
    if label.review_status == ReviewStatus.not_started:
        label.review_status = ReviewStatus.in_progress
        session.add(label)
    session.add(label_data)
    session.flush()
    session.refresh(label_data)
    return label_data


@validate_call(config={"arbitrary_types_allowed": True})
def get_label_data_meta(
    session: Session,
    label_data_id: UUID,
    field_name: str | None = None,
    needs_review: bool | None = None,
) -> list[LabelDataFieldMeta]:
    """Fetch meta records with optional field_name/needs_review filters."""
    stmt = select(LabelDataFieldMeta).where(
        LabelDataFieldMeta.label_id == label_data_id
    )
    if field_name is not None:
        stmt = stmt.where(LabelDataFieldMeta.field_name == field_name)
    if needs_review is not None:
        stmt = stmt.where(LabelDataFieldMeta.needs_review == needs_review)
    result = session.execute(stmt)
    return list(result.scalars().all())


@validate_call(config={"arbitrary_types_allowed": True})
def upsert_label_data_meta(
    session: Session,
    label: Label,
    label_data_id: UUID,
    meta_in: LabelDataFieldMetaUpdate,
) -> LabelDataFieldMeta:
    """Create or update single meta record."""
    meta_list = get_label_data_meta(
        session, label_data_id, field_name=meta_in.field_name.value
    )
    if meta := next(iter(meta_list), None):
        # Update meta with provided values (meta is already in session if it existed)
        if update_data := meta_in.model_dump(
            exclude_unset=True,
            exclude_none=True,
            exclude={"field_name"},
        ):
            meta.sqlmodel_update(update_data)
    else:
        # Create meta row if it doesn't exist
        meta = LabelDataFieldMeta(
            label_id=label_data_id,
            field_name=meta_in.field_name.value,
            needs_review=bool(meta_in.needs_review)
            if meta_in.needs_review is not None
            else False,
            note=meta_in.note,
            ai_generated=bool(meta_in.ai_generated)
            if meta_in.ai_generated is not None
            else False,
        )
    session.add(meta)
    # Auto-transition Label review_status from not_started → in_progress
    if label.review_status == ReviewStatus.not_started:
        label.review_status = ReviewStatus.in_progress
        session.add(label)
    session.flush()
    session.refresh(meta)
    return meta
