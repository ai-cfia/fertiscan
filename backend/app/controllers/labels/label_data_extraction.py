"""Label data extraction operations."""

import asyncio
import mimetypes
from typing import cast

import instructor
from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from pydantic import BaseModel, create_model, validate_call

from app.db.models import Label, UploadStatus
from app.schemas.label_data import ExtractFertilizerFieldsOutput
from app.services.label_data_extraction import ImageData, extract_fields_from_images
from app.storage import download_file


def create_subset_model(
    base_model: type[BaseModel], field_names: list[str]
) -> type[BaseModel]:
    """Create a new model with only the specified fields from the base model."""
    field_definitions = {
        field_name: (
            base_model.model_fields[field_name].annotation,
            base_model.model_fields[field_name],
        )
        for field_name in field_names
        if field_name in base_model.model_fields
    }
    if len(field_definitions) != len(field_names):
        missing = set(field_names) - set(field_definitions.keys())
        raise ValueError(f"Fields not found in {base_model.__name__}: {missing}")
    return create_model(f"{base_model.__name__}Subset", **field_definitions)  # type: ignore[call-overload,no-any-return]


@validate_call(config={"arbitrary_types_allowed": True})
async def extract_fertilizer_fields(
    s3_client: AioBaseClient,
    label: Label,
    instructor: instructor.AsyncInstructor,
    field_names: list[str] | None = None,
) -> ExtractFertilizerFieldsOutput:
    """Extract specified fields (or all fields if none specified) for fertilizer
    labels."""
    paths = [i.file_path for i in label.images if i.status == UploadStatus.completed]
    imgs = await asyncio.gather(*[download_file(s3_client, path) for path in paths])
    content_types = [mimetypes.guess_type(path)[0] or "image/jpeg" for path in paths]
    images = [ImageData(b, t) for b, t in zip(imgs, content_types, strict=True)]
    response_model: type[BaseModel] = ExtractFertilizerFieldsOutput
    if field_names:
        response_model = create_subset_model(ExtractFertilizerFieldsOutput, field_names)
    result, _completion = await extract_fields_from_images(
        images,
        response_model,
        "Extract fertilizer label information from these label images exactly as written.",
        instructor,
    )
    if field_names:
        return ExtractFertilizerFieldsOutput.model_validate(result.model_dump())
    return cast(ExtractFertilizerFieldsOutput, result)
