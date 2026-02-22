"""Fertilizer label data dependencies."""

from typing import Annotated

from fastapi import Depends
from sqlmodel import select

from app.db.models.fertilizer_label_data import FertilizerLabelData
from app.dependencies.auth import SessionDep
from app.dependencies.labels import FertilizerLabelDep
from app.exceptions import LabelNotFound


# ============================== FertilizerLabelData Dependencies ==============================
def get_fertilizer_label_data_by_label_id(
    session: SessionDep,
    label: FertilizerLabelDep,
) -> FertilizerLabelData:
    """Get FertilizerLabelData by label_id or raise 404."""
    stmt = select(FertilizerLabelData).where(FertilizerLabelData.label_id == label.id)
    if not (fertilizer_label_data := session.exec(stmt).first()):
        raise LabelNotFound(f"FertilizerLabelData not found for label {label.id}")
    return fertilizer_label_data


FertilizerLabelDataDep = Annotated[
    FertilizerLabelData, Depends(get_fertilizer_label_data_by_label_id)
]
