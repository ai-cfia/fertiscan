"""FertilizerLabelData CRUD operations."""

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session
from sqlmodel import select

from app.db.models.fertilizer_label_data import FertilizerLabelData
from app.db.models.fertilizer_label_data_meta import FertilizerLabelDataMeta
from app.db.models.label import Label, ReviewStatus
from app.schemas.label_data import (
    FertilizerLabelDataCreate,
    FertilizerLabelDataMetaUpdate,
    FertilizerLabelDataUpdate,
)


@validate_call(config={"arbitrary_types_allowed": True})
def create_fertilizer_label_data(
    session: Session,
    label_id: UUID,
    data_in: FertilizerLabelDataCreate,
) -> FertilizerLabelData:
    """Create FertilizerLabelData record."""
    dump_data = data_in.model_dump(mode="json")
    data = FertilizerLabelData(label_id=label_id, **dump_data)
    session.add(data)
    session.flush()
    session.refresh(data)
    return data


@validate_call(config={"arbitrary_types_allowed": True})
def get_fertilizer_label_data(
    session: Session,
    label_id: UUID,
) -> FertilizerLabelData | None:
    """Fetch FertilizerLabelData by label_id, return None if not found."""
    stmt = select(FertilizerLabelData).where(FertilizerLabelData.label_id == label_id)
    result = session.execute(stmt)
    return result.scalar_one_or_none()


@validate_call(config={"arbitrary_types_allowed": True})
def update_fertilizer_label_data(
    session: Session,
    label: Label,
    fertilizer_label_data: FertilizerLabelData,
    data_in: FertilizerLabelDataUpdate,
) -> FertilizerLabelData:
    """Partial update FertilizerLabelData fields."""
    if not (update_data := data_in.model_dump(exclude_unset=True, mode="json")):
        return fertilizer_label_data
    fertilizer_label_data.sqlmodel_update(update_data)
    # Auto-transition Label review_status from not_started → in_progress
    if label.review_status == ReviewStatus.not_started:
        label.review_status = ReviewStatus.in_progress
        session.add(label)
    session.add(fertilizer_label_data)
    session.flush()
    session.refresh(fertilizer_label_data)
    return fertilizer_label_data


@validate_call(config={"arbitrary_types_allowed": True})
def get_fertilizer_label_data_meta(
    session: Session,
    fertilizer_label_data_id: UUID,
    field_name: str | None = None,
    needs_review: bool | None = None,
) -> list[FertilizerLabelDataMeta]:
    """Fetch meta records with optional field_name/needs_review filters."""
    stmt = select(FertilizerLabelDataMeta).where(
        FertilizerLabelDataMeta.label_id == fertilizer_label_data_id
    )
    if field_name is not None:
        stmt = stmt.where(FertilizerLabelDataMeta.field_name == field_name)
    if needs_review is not None:
        stmt = stmt.where(FertilizerLabelDataMeta.needs_review == needs_review)
    result = session.execute(stmt)
    return list(result.scalars().all())


@validate_call(config={"arbitrary_types_allowed": True})
def upsert_fertilizer_label_data_meta(
    session: Session,
    label: Label,
    fertilizer_label_data_id: UUID,
    meta_in: FertilizerLabelDataMetaUpdate,
) -> FertilizerLabelDataMeta:
    """Create or update single meta record."""
    meta_list = get_fertilizer_label_data_meta(
        session, fertilizer_label_data_id, field_name=meta_in.field_name.value
    )
    update_data = meta_in.model_dump(
        exclude_unset=True,
        exclude_none=True,
        exclude={"field_name"},
    )
    # Create meta row if it doesn't exist
    if not (meta := next(iter(meta_list), None)):
        meta = FertilizerLabelDataMeta(
            label_id=fertilizer_label_data_id,
            field_name=meta_in.field_name.value,
            needs_review=update_data.get("needs_review", False),
            note=update_data.get("note"),
            ai_generated=update_data.get("ai_generated", False),
        )
        session.add(meta)
    # Update meta with provided values (meta is already in session if it existed)
    elif update_data:
        meta.sqlmodel_update(update_data)
    # Auto-transition Label review_status from not_started → in_progress
    if label.review_status == ReviewStatus.not_started:
        label.review_status = ReviewStatus.in_progress
        session.add(label)
    session.flush()
    session.refresh(meta)
    return meta
