"""Label data extraction operations."""

import asyncio
import mimetypes
import re
from typing import cast

import instructor
from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from pydantic import BaseModel, create_model, validate_call

from app import storage
from app.db.models import Label, UploadStatus
from app.schemas.label_data import ExtractFertilizerFieldsOutput
from app.services import extraction

FIELD_GROUPS = [
    [
        "brand_name",
        "product_name",
        "contacts",
        "registration_number",
        "registration_claim",
    ],
    [
        "lot_number",
        "net_weight",
        "volume",
        "exemption_claim",
        "country_of_origin",
        "product_classification",
    ],
    ["n", "p", "k", "precaution_statements"],
    ["ingredients", "guaranteed_analysis"],
    [
        "customer_formula_statements",
        "intended_use_statements",
        "processing_instruction_statements",
        "experimental_statements",
        "export_statements",
        "directions_for_use_statements",
    ],
]

_EXTRACTION_PROMPT = (
    "Extract fertilizer label fields exactly as written. "
    "Missing, unreadable, incomplete, or unclear -> null. "
    "Do not guess. Do not repeat items. "
    "For lists, include each distinct item once only. "
    "Keep outputs concise: no explanations, no commentary. "
    "For long lists, keep only the first distinct items in reading order."
)
_REGISTRATION_NUMBER_PATTERN = re.compile(r"^[0-9]{7}[A-Za-z]$")


def _normalize_nullable_text(value: object) -> object:
    if isinstance(value, str) and value.strip().lower() in {
        "",
        "null",
        "none",
        "n/a",
        "na",
    }:
        return None
    return value


def _sanitize_output_payload(payload: dict[str, object]) -> dict[str, object]:
    sanitized = dict(payload)

    raw = sanitized.get("registration_number")
    if isinstance(raw, str):
        reg = raw.strip().upper()
        sanitized["registration_number"] = (
            reg if _REGISTRATION_NUMBER_PATTERN.fullmatch(reg) else ""
        )
    elif raw is None:
        sanitized["registration_number"] = None
    else:
        sanitized["registration_number"] = ""

    ingredients = sanitized.get("ingredients")
    if isinstance(ingredients, list):
        cleaned_ingredients = [item for item in ingredients if isinstance(item, dict)]
        sanitized["ingredients"] = cleaned_ingredients if cleaned_ingredients else None
    else:
        sanitized["ingredients"] = None

    ga = sanitized.get("guaranteed_analysis")
    if isinstance(ga, dict):
        title = ga.get("title")
        nutrients = ga.get("nutrients")
        is_minimum = ga.get("is_minimum")
        if isinstance(nutrients, list):
            cleaned_nutrients: list[dict[str, object]] = []
            for nutrient in nutrients:
                if not isinstance(nutrient, dict):
                    continue
                name = nutrient.get("name")
                if isinstance(name, dict):
                    en = _normalize_nullable_text(name.get("en"))
                    fr = _normalize_nullable_text(name.get("fr"))
                    name = {"en": en, "fr": fr}
                value = _normalize_nullable_text(nutrient.get("value"))
                unit = _normalize_nullable_text(nutrient.get("unit"))
                if value is None or unit is None or not isinstance(name, dict):
                    continue
                cleaned_nutrients.append({"name": name, "value": value, "unit": unit})
            if (
                isinstance(title, dict)
                and isinstance(is_minimum, bool)
                and cleaned_nutrients
            ):
                sanitized["guaranteed_analysis"] = {
                    "title": title,
                    "is_minimum": is_minimum,
                    "nutrients": cleaned_nutrients,
                }
            else:
                sanitized["guaranteed_analysis"] = None
        else:
            sanitized["guaranteed_analysis"] = None
    else:
        sanitized["guaranteed_analysis"] = None

    return sanitized


def create_subset_model(
    base_model: type[BaseModel], field_names: list[str]
) -> type[BaseModel]:
    """Create a new model with only the specified fields from the base model."""
    field_definitions: dict[str, tuple[object, object]] = {}
    for field_name in field_names:
        if field_name not in base_model.model_fields:
            continue
        field = base_model.model_fields[field_name]
        annotation: object = field.annotation
        default: object = ... if field.is_required() else field.default
        if field_name == "registration_number":
            annotation = str | None
            default = None
        if field_name == "ingredients":
            annotation = object | None
            default = None
        if field_name == "guaranteed_analysis":
            annotation = object | None
            default = None
        field_definitions[field_name] = (annotation, default)
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
    imgs = await asyncio.gather(
        *[storage.download_file(s3_client, path) for path in paths]
    )
    content_types = [mimetypes.guess_type(path)[0] or "image/jpeg" for path in paths]
    images = [
        extraction.ImageData(b, t) for b, t in zip(imgs, content_types, strict=True)
    ]
    response_model: type[BaseModel] = ExtractFertilizerFieldsOutput
    if field_names:
        response_model = create_subset_model(ExtractFertilizerFieldsOutput, field_names)
        result, _completion = await extraction.extract_fields_from_images(
            images,
            response_model,
            _EXTRACTION_PROMPT,
            instructor,
        )
        dumped = _sanitize_output_payload(result.model_dump())
        return ExtractFertilizerFieldsOutput.model_validate(dumped)

    pairs = await asyncio.gather(
        *[
            extraction.extract_fields_from_images(
                images,
                create_subset_model(ExtractFertilizerFieldsOutput, group),
                _EXTRACTION_PROMPT,
                instructor,
            )
            for group in FIELD_GROUPS
        ]
    )
    merged: dict[str, object] = {}
    for result, _completion in pairs:
        merged.update(result.model_dump())
    merged = _sanitize_output_payload(merged)
    return cast(
        ExtractFertilizerFieldsOutput,
        ExtractFertilizerFieldsOutput.model_validate(merged),
    )
