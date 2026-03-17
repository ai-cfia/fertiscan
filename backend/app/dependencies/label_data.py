"""Label data dependencies."""

from typing import Annotated

from fastapi import Depends
from sqlmodel import select

from app.db.models.label_data import LabelData
from app.dependencies.labels import LabelDep
from app.dependencies.session import SessionDep
from app.exceptions import LabelNotFound


# ============================== LabelData Dependencies ==============================
def get_label_data_by_label_id(
    session: SessionDep,
    label: LabelDep,
) -> LabelData:
    """Get LabelData by label_id or raise 404."""
    stmt = select(LabelData).where(LabelData.label_id == label.id)
    if not (label_data := session.exec(stmt).first()):
        raise LabelNotFound(f"LabelData not found for label {label.id}")
    return label_data


LabelDataDep = Annotated[LabelData, Depends(get_label_data_by_label_id)]
