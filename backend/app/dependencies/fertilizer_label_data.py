"""Fertilizer label data dependencies."""

from typing import Annotated

from fastapi import Depends, Path
from sqlmodel import select

from app.db.models.fertilizer_label_data import FertilizerLabelData
from app.db.models.fertilizer_label_data_meta import FertilizerLabelDataFieldName
from app.db.models.label_data_field_meta import LabelDataFieldName
from app.dependencies.auth import SessionDep
from app.dependencies.labels import FertilizerTypeLabelDep
from app.exceptions import InvalidProductType, LabelNotFound


# ============================== Field Name Validation Dependencies ==============================
def verify_fertilizer_field_name(
    field_name: str = Path(description="Field name to extract"),
) -> str:
    """Verify field_name belongs to fertilizer product type (common or fertilizer fields), raise 400 if not."""
    try:
        LabelDataFieldName(field_name)
    except ValueError:
        try:
            FertilizerLabelDataFieldName(field_name)
        except ValueError:
            raise InvalidProductType(
                f"Field '{field_name}' does not belong to fertilizer product type"
            )
    return field_name


FertilizerFieldNameDep = Annotated[str, Depends(verify_fertilizer_field_name)]


# ============================== FertilizerLabelData Dependencies ==============================
def get_fertilizer_label_data_by_label_id(
    session: SessionDep,
    label: FertilizerTypeLabelDep,
) -> FertilizerLabelData:
    """Get FertilizerLabelData by label_id or raise 404."""
    stmt = select(FertilizerLabelData).where(FertilizerLabelData.label_id == label.id)
    result = session.execute(stmt)
    if not (fertilizer_label_data := result.scalar_one_or_none()):
        raise LabelNotFound(f"FertilizerLabelData not found for label {label.id}")
    return fertilizer_label_data


FertilizerLabelDataDep = Annotated[
    FertilizerLabelData, Depends(get_fertilizer_label_data_by_label_id)
]
