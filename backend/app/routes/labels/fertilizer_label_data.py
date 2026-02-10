"""Fertilizer label data routes."""

from typing import Annotated

from fastapi import APIRouter, Query
from pydantic import StringConstraints

from app.controllers import labels as label_controller
from app.dependencies import (
    CurrentUser,
    FertilizerLabelDataDep,
    FertilizerLabelDep,
    LabelWithoutFertilizerDataDep,
    SessionDep,
)
from app.schemas.label_data import (
    FertilizerLabelData,
    FertilizerLabelDataCreate,
    FertilizerLabelDataMetaResponse,
    FertilizerLabelDataMetaUpdate,
    FertilizerLabelDataUpdate,
)

router = APIRouter(prefix="/labels", tags=["labels"])


# ============================== FertilizerLabelData ==============================
@router.post(
    "/{label_id}/fertilizer-data",
    response_model=FertilizerLabelData,
    status_code=201,
)
def create_fertilizer_label_data(
    session: SessionDep,
    _: CurrentUser,
    label: LabelWithoutFertilizerDataDep,
    data_in: FertilizerLabelDataCreate,
) -> FertilizerLabelData:
    """Create FertilizerLabelData for label."""
    return label_controller.create_fertilizer_label_data(  # type: ignore[return-value]
        session=session,
        label_id=label.id,
        data_in=data_in,
    )


@router.get("/{label_id}/fertilizer-data", response_model=FertilizerLabelData)
def read_fertilizer_label_data(
    _: CurrentUser,
    fertilizer_label_data: FertilizerLabelDataDep,
) -> FertilizerLabelData:
    """Get FertilizerLabelData for label."""
    return fertilizer_label_data  # type: ignore[return-value]


@router.patch("/{label_id}/fertilizer-data", response_model=FertilizerLabelData)
def update_fertilizer_label_data(
    session: SessionDep,
    _: CurrentUser,
    label: FertilizerLabelDep,
    fertilizer_label_data: FertilizerLabelDataDep,
    data_in: FertilizerLabelDataUpdate,
) -> FertilizerLabelData:
    """Update FertilizerLabelData (partial update)."""
    return label_controller.update_fertilizer_label_data(  # type: ignore[return-value]
        session=session,
        label=label,
        fertilizer_label_data=fertilizer_label_data,
        data_in=data_in,
    )


# ============================== FertilizerLabelDataMeta ==============================
@router.get(
    "/{label_id}/fertilizer-data/meta",
    response_model=list[FertilizerLabelDataMetaResponse],
)
def read_fertilizer_label_data_meta(
    session: SessionDep,
    _: CurrentUser,
    fertilizer_label_data: FertilizerLabelDataDep,
    field_name: Annotated[str | None, StringConstraints(strip_whitespace=True)] = Query(
        default=None, description="Filter by field name"
    ),
    needs_review: bool | None = Query(
        default=None, description="Filter by needs_review flag"
    ),
) -> list[FertilizerLabelDataMetaResponse]:
    """Get FertilizerLabelDataMeta records for label."""
    return label_controller.get_fertilizer_label_data_meta(  # type: ignore[return-value]
        session=session,
        fertilizer_label_data_id=fertilizer_label_data.id,
        field_name=field_name,
        needs_review=needs_review,
    )


@router.patch(
    "/{label_id}/fertilizer-data/meta",
    response_model=FertilizerLabelDataMetaResponse,
)
def update_fertilizer_label_data_meta(
    session: SessionDep,
    _: CurrentUser,
    label: FertilizerLabelDep,
    fertilizer_label_data: FertilizerLabelDataDep,
    meta_in: FertilizerLabelDataMetaUpdate,
) -> FertilizerLabelDataMetaResponse:
    """Update FertilizerLabelDataMeta (upsert)."""
    return label_controller.upsert_fertilizer_label_data_meta(  # type: ignore[return-value]
        session=session,
        label=label,
        fertilizer_label_data_id=fertilizer_label_data.id,
        meta_in=meta_in,
    )
