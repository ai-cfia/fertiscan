"""Label CRUD operations."""

from typing import Any
from uuid import UUID

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from pydantic import validate_call
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.controllers.products import create_product
from app.db.models.label import Label, ReviewStatus
from app.db.models.label_data import LabelData
from app.dependencies import CurrentUser
from app.dependencies.products import (
    ensure_product_registration_number_unique,
)
from app.schemas.label import LabelReviewStatusUpdate, LabelUpdate
from app.schemas.product import ProductCreate
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
def load_label_with_images_and_product_type(
    session: Session,
    label: Label,
) -> Label:
    """Load label with images and product_type relationships."""
    stmt = (
        select(Label)
        .where(Label.id == label.id)
        .options(
            selectinload(Label.images),  # type: ignore[arg-type]
            selectinload(Label.product_type),  # type: ignore[arg-type]
        )
    )
    result = session.execute(stmt)
    return result.scalar_one()


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
    result = session.execute(stmt)
    return result.scalar_one()


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
    status_in: LabelReviewStatusUpdate,
    current_user: CurrentUser,
) -> Label:
    """Update Label review_status (allowed even when completed)."""
    # Router already validated label.label_data exists and has registration_number, so we can use it directly.
    # SQLAlchemy lazy-loads it when accessed, so no need for explicit query or None check.
    label_data = label.label_data
    assert label_data is not None  # Validated by router layer
    assert label_data.registration_number is not None  # Validated by router layer

    if label.product_id is None:
        product_in = ProductCreate(
            registration_number=label_data.registration_number,
            product_type=label.product_type.code,
            brand_name_en=label_data.brand_name_en,
            brand_name_fr=label_data.brand_name_fr,
            name_en=label_data.product_name_en,
            name_fr=label_data.product_name_fr,
        )
        product = ensure_product_registration_number_unique(
            session=session,
            current_user=current_user,
            product_in=product_in,
            product_type=label.product_type,
        )
        # Use returned product for explicitness (SQLAlchemy modifies objects in place, so
        # product.id would work either way, but using return value makes intent clearer).
        product = create_product(session=session, product=product)
        label.product_id = product.id

    label.review_status = status_in.review_status
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
