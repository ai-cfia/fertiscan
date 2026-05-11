"""Shared helpers to build transient labels from JSON fixtures."""

import json
import logging
from pathlib import Path
from uuid import uuid4

from pydantic import ValidationError

from app.db.models.enums import ReviewStatus
from app.db.models.fertilizer_label_data import FertilizerLabelData
from app.db.models.label import Label
from app.db.models.label_data import LabelData
from app.schemas.label_data import ExtractFertilizerFieldsOutput

logger = logging.getLogger(__name__)

LABEL_DATA_FIELDS = (
    "brand_name",
    "product_name",
    "contacts",
    "registration_number",
    "registration_claim",
    "lot_number",
    "net_weight",
    "volume",
    "exemption_claim",
    "country_of_origin",
)

FERTILIZER_DATA_FIELDS = (
    "n",
    "p",
    "k",
    "ingredients",
    "guaranteed_analysis",
    "precaution_statements",
    "directions_for_use_statements",
    "customer_formula_statements",
    "intended_use_statements",
    "processing_instruction_statements",
    "experimental_statements",
    "export_statements",
    "product_classification",
)


def read_json_file(path: Path) -> dict[str, object]:
    """Read a JSON object from disk."""

    with path.open("r", encoding="utf-8") as file:
        payload = json.load(file)
    if not isinstance(payload, dict):
        raise ValueError(f"Payload must be an object in {path}")
    return payload


def validate_label_payload(
    payload: dict[str, object],
) -> ExtractFertilizerFieldsOutput:
    """Validate a label payload using the extraction schema."""

    return ExtractFertilizerFieldsOutput.model_validate(payload)


def split_payload(
    data: dict[str, object],
) -> tuple[dict[str, object], dict[str, object]]:
    """Split payload into label-level and fertilizer-level sections."""

    label_data_payload = {k: data.get(k) for k in LABEL_DATA_FIELDS}
    fertilizer_data_payload = {k: data.get(k) for k in FERTILIZER_DATA_FIELDS}
    return label_data_payload, fertilizer_data_payload


def build_transient_label(
    label_data_payload: dict[str, object],
    fertilizer_data_payload: dict[str, object],
) -> Label:
    """Build a transient label object without persisting it."""

    label_id = uuid4()
    label_data = LabelData(label_id=label_id, **label_data_payload)
    fertilizer_data = FertilizerLabelData(label_id=label_id, **fertilizer_data_payload)

    return Label(
        id=label_id,
        product_type_id=uuid4(),
        created_by_id=uuid4(),
        review_status=ReviewStatus.not_started,
        label_data=label_data,
        fertilizer_label_data=fertilizer_data,
    )


def create_labels_from_dir(
    data_dir: Path,
    *,
    pattern: str = "label*.json",
) -> list[tuple[str, Label]]:
    """Load JSON fixtures from a directory into transient Label objects."""

    labels: list[tuple[str, Label]] = []
    for path in sorted(data_dir.glob(pattern)):
        try:
            payload = read_json_file(path)
            extracted = validate_label_payload(payload)
            data = extracted.model_dump(mode="json")
            label_payload, fert_payload = split_payload(data)
            labels.append(
                (path.name, build_transient_label(label_payload, fert_payload))
            )
        except (ValidationError, ValueError) as exc:
            logger.error("Skipping %s: %s", path, exc)
    return labels
