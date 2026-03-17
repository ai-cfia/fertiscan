"""Label data extraction operations."""

import asyncio
import logging
import mimetypes
import re

import instructor
from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from instructor.core.exceptions import InstructorRetryException
from pydantic import BaseModel, create_model, validate_call

from app import storage
from app.db.models import Label, UploadStatus
from app.schemas.label_data import ExtractFertilizerFieldsOutput
from app.services import extraction

logger = logging.getLogger(__name__)

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
    "If a field is missing, unreadable, incomplete, or unclear → null. "
    "No guessing. No duplicates. "
    "For guaranteed_analysis, treat any heading variant "
    "('Guaranteed Analysis', 'Minimum Guaranteed Analysis', "
    "'Analyse garantie', etc.) as the section title. "
    "If only the title appears, still output guaranteed_analysis with the "
    "title, a best‑effort is_minimum flag, and nutrients=[]. "
    "Lists: keep each distinct item once, in reading order; truncate long lists "
    "to the first distinct items. "
    "Output only the extracted fields—no explanations."
)

_REGISTRATION_NUMBER_PATTERN = re.compile(r"^[0-9]{7}[A-Za-z]$")
_NUMERIC_VALUE_WITH_UNIT_PATTERN = re.compile(
    r"^\s*([0-9]+(?:[.,][0-9]+)?)\s*([%A-Za-zµ/²0-9.-]*)\s*$"
)
_MAX_FIELDS_PER_SUBSET_REQUEST = 3


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


def _infer_is_minimum_from_title(title: dict[str, object]) -> bool | None:
    title_en = _normalize_nullable_text(title.get("en"))
    title_fr = _normalize_nullable_text(title.get("fr"))
    texts = [text for text in [title_en, title_fr] if isinstance(text, str)]
    if not texts:
        return None
    lowered = " ".join(text.lower() for text in texts)
    if "minimum" in lowered or "minimale" in lowered or "minimal" in lowered:
        return True
    return False


def _build_nutrient_from_flat_entry(
    name: str, raw_value: object
) -> dict[str, object] | None:
    if not isinstance(name, str) or not name.strip() or not isinstance(raw_value, str):
        return None
    value_text = raw_value.strip()
    if not value_text:
        return None
    match = _NUMERIC_VALUE_WITH_UNIT_PATTERN.fullmatch(value_text)
    if not match:
        return None
    numeric = match.group(1).replace(",", ".")
    unit = match.group(2).strip() or "%"
    return {
        "name": {"en": name.strip(), "fr": None},
        "value": numeric,
        "unit": unit,
    }


def _parse_value_and_unit(raw_value: object) -> tuple[object, object]:
    value = _normalize_nullable_text(raw_value)
    if not isinstance(value, str):
        return value, None
    match = _NUMERIC_VALUE_WITH_UNIT_PATTERN.fullmatch(value.strip())
    if not match:
        return value, None
    numeric = match.group(1).replace(",", ".")
    unit = match.group(2).strip() or "%"
    return numeric, unit


def _parse_flat_guaranteed_analysis_payload(
    payload: dict[str, object],
) -> list[dict[str, object]]:
    reserved = {"title", "is_minimum", "nutrients"}
    nutrients: list[dict[str, object]] = []
    for key, value in payload.items():
        if key in reserved:
            continue
        if nutrient := _build_nutrient_from_flat_entry(key, value):
            nutrients.append(nutrient)
    return nutrients


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
        flat_nutrients = _parse_flat_guaranteed_analysis_payload(ga)
        title = ga.get("title")
        nutrients = ga.get("nutrients")
        is_minimum = ga.get("is_minimum")
        if isinstance(title, str):
            title = {"en": title.strip() or None, "fr": None}
        if not isinstance(title, dict) and flat_nutrients:
            title = {"en": "Guaranteed Analysis", "fr": "Analyse garantie"}
        if not isinstance(nutrients, list) and flat_nutrients:
            nutrients = flat_nutrients
        if isinstance(title, dict):
            title = {
                "en": _normalize_nullable_text(title.get("en")),
                "fr": _normalize_nullable_text(title.get("fr")),
            }
        else:
            title = None
        inferred_is_minimum = (
            is_minimum
            if isinstance(is_minimum, bool)
            else (
                _infer_is_minimum_from_title(title) if isinstance(title, dict) else None
            )
        )
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
                elif isinstance(name, str):
                    name = {"en": _normalize_nullable_text(name), "fr": None}
                value_source = nutrient.get("value", nutrient.get("amount"))
                value, parsed_unit = _parse_value_and_unit(value_source)
                unit = _normalize_nullable_text(nutrient.get("unit"))
                if unit is None:
                    unit = parsed_unit
                if value is None or unit is None or not isinstance(name, dict):
                    continue
                cleaned_nutrients.append({"name": name, "value": value, "unit": unit})
            if isinstance(title, dict) and isinstance(inferred_is_minimum, bool):
                sanitized["guaranteed_analysis"] = {
                    "title": title,
                    "is_minimum": inferred_is_minimum,
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
async def _extract_subset_with_fallback(
    images: list[extraction.ImageData],
    field_names: list[str],
    instructor_client: instructor.AsyncInstructor,
) -> dict[str, object]:
    if len(field_names) > _MAX_FIELDS_PER_SUBSET_REQUEST:
        midpoint = len(field_names) // 2
        left_fields = field_names[:midpoint]
        right_fields = field_names[midpoint:]
        left_payload, right_payload = await asyncio.gather(
            _extract_subset_with_fallback(images, left_fields, instructor_client),
            _extract_subset_with_fallback(images, right_fields, instructor_client),
        )
        merged_payload_retry: dict[str, object] = {}
        merged_payload_retry.update(left_payload)
        merged_payload_retry.update(right_payload)
        return merged_payload_retry

    response_model = create_subset_model(ExtractFertilizerFieldsOutput, field_names)
    try:
        result, _completion = await extraction.extract_fields_from_images(
            images,
            response_model,
            _EXTRACTION_PROMPT,
            instructor_client,
        )
        return result.model_dump()
    except InstructorRetryException as exc:
        if len(field_names) == 1:
            logger.warning(
                "Extraction failed for field %s; returning null. Error type: %s",
                field_names[0],
                type(exc).__name__,
            )
            return response_model.model_validate({}).model_dump()

        midpoint = len(field_names) // 2
        left_fields = field_names[:midpoint]
        right_fields = field_names[midpoint:]
        logger.warning(
            "Extraction failed for fields %s; retrying in smaller subsets: %s | %s. Error type: %s",
            field_names,
            left_fields,
            right_fields,
            type(exc).__name__,
        )

        left_payload, right_payload = await asyncio.gather(
            _extract_subset_with_fallback(images, left_fields, instructor_client),
            _extract_subset_with_fallback(images, right_fields, instructor_client),
        )
        merged_payload: dict[str, object] = {}
        merged_payload.update(left_payload)
        merged_payload.update(right_payload)
        return merged_payload


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
    if field_names:
        dumped = await _extract_subset_with_fallback(images, field_names, instructor)
        dumped = _sanitize_output_payload(dumped)
        return ExtractFertilizerFieldsOutput.model_validate(dumped)

    subset_payloads = await asyncio.gather(
        *[
            _extract_subset_with_fallback(images, group, instructor)
            for group in FIELD_GROUPS
        ]
    )
    merged: dict[str, object] = {}
    for payload in subset_payloads:
        merged.update(payload)
    merged = _sanitize_output_payload(merged)
    return ExtractFertilizerFieldsOutput.model_validate(merged)
