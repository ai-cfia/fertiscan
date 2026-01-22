"""Label data extraction routes."""

from fastapi import APIRouter

from app.controllers import labels as label_controller
from app.dependencies import (
    CurrentUser,
    FertilizerTypeLabelWithCompletedImagesEditDep,
    InstructorDep,
    S3ClientDep,
)
from app.schemas.label_data import ExtractFertilizerFieldsOutput, ExtractFieldsRequest

router = APIRouter(prefix="/labels", tags=["labels"])


# ============================== Extraction ==============================
@router.post(
    "/{label_id}/fertilizer-extract",
    response_model=ExtractFertilizerFieldsOutput,
)
async def extract_fertilizer_fields(
    s3_client: S3ClientDep,
    _: CurrentUser,
    label: FertilizerTypeLabelWithCompletedImagesEditDep,
    instructor: InstructorDep,
    request: ExtractFieldsRequest | None = None,
) -> ExtractFertilizerFieldsOutput:
    """Extract specified fields (or all fields if none specified) for fertilizer labels."""
    field_names = (
        [f.value for f in request.field_names]
        if request and request.field_names
        else None
    )
    return await label_controller.extract_fertilizer_fields(
        s3_client=s3_client,
        label=label,
        instructor=instructor,
        field_names=field_names,
    )
