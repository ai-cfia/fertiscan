"""Label data routes."""

from typing import Annotated

from fastapi import APIRouter, Query
from pydantic import StringConstraints

from app.controllers import labels as label_controller
from app.dependencies import (
    CurrentUser,
    EditableLabelDep,
    LabelDataDep,
    LabelWithoutDataDep,
    SessionDep,
)
from app.schemas.label_data import (
    LabelData,
    LabelDataCreate,
    LabelDataFieldMetaResponse,
    LabelDataFieldMetaUpdate,
    LabelDataUpdate,
)

router = APIRouter(prefix="/labels", tags=["labels"])


# ============================== LabelData ==============================
@router.post(
    "/{label_id}/data",
    response_model=LabelData,
    status_code=201,
)
def create_label_data(
    session: SessionDep,
    _: CurrentUser,
    label: LabelWithoutDataDep,
    data_in: LabelDataCreate,
) -> LabelData:
    """Create LabelData for label."""
    return label_controller.create_label_data(  # type: ignore[return-value]
        session=session,
        label_id=label.id,
        data_in=data_in,
    )


@router.get("/{label_id}/data", response_model=LabelData)
def read_label_data(
    _: CurrentUser,
    label_data: LabelDataDep,
) -> LabelData:
    """Get LabelData for label."""
    return label_data  # type: ignore[return-value]


@router.patch("/{label_id}/data", response_model=LabelData)
def update_label_data(
    session: SessionDep,
    _: CurrentUser,
    label: EditableLabelDep,
    label_data: LabelDataDep,
    data_in: LabelDataUpdate,
) -> LabelData:
    """Update LabelData (partial update)."""
    return label_controller.update_label_data(  # type: ignore[return-value]
        session=session,
        label=label,
        label_data=label_data,
        data_in=data_in,
    )


# ============================== LabelDataMeta ==============================
@router.get("/{label_id}/data/meta", response_model=list[LabelDataFieldMetaResponse])
def read_label_data_meta(
    session: SessionDep,
    _: CurrentUser,
    label_data: LabelDataDep,
    field_name: Annotated[str | None, StringConstraints(strip_whitespace=True)] = Query(
        default=None, description="Filter by field name"
    ),
    needs_review: bool | None = Query(
        default=None, description="Filter by needs_review flag"
    ),
) -> list[LabelDataFieldMetaResponse]:
    """Get LabelDataFieldMeta records for label."""
    return label_controller.get_label_data_meta(  # type: ignore[return-value]
        session=session,
        label_data_id=label_data.id,
        field_name=field_name,
        needs_review=needs_review,
    )


@router.patch("/{label_id}/data/meta", response_model=LabelDataFieldMetaResponse)
def update_label_data_meta(
    session: SessionDep,
    _: CurrentUser,
    label: EditableLabelDep,
    label_data: LabelDataDep,
    meta_in: LabelDataFieldMetaUpdate,
) -> LabelDataFieldMetaResponse:
    """Update LabelDataFieldMeta (upsert)."""
    return label_controller.upsert_label_data_meta(  # type: ignore[return-value]
        session=session,
        label=label,
        label_data_id=label_data.id,
        meta_in=meta_in,
    )
