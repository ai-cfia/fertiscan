"""Loaders for compliance benchmark inputs and ground truth."""

import json
import logging
from pathlib import Path
from uuid import uuid4

from pydantic import ValidationError

from app.benchmark.compliance.tools.prescript import DATA_DIR, GROUND_TRUTH_DIR
from app.benchmark.compliance.tools.status import normalize_compliance_status
from app.db.models.enums import ReviewStatus
from app.db.models.fertilizer_label_data import FertilizerLabelData
from app.db.models.label import Label
from app.db.models.label_data import LabelData
from app.schemas.label_data import ExtractFertilizerFieldsOutput

logger = logging.getLogger(__name__)

GroundTruthByKey = dict[str, dict[str, str | None]]
GroundTruthIndex = dict[str, GroundTruthByKey]

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
    """Split the payload into label-level and fertilizer-level sections."""

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


def create_labels() -> list[tuple[str, Label]]:
    """Load all label fixtures into transient Label objects."""

    labels: list[tuple[str, Label]] = []
    for path in sorted(DATA_DIR.glob("label*.json")):
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


def load_ground_truth_index() -> GroundTruthIndex:
    """Load the benchmark ground truth as a label-file keyed index."""

    index: GroundTruthIndex = {}

    for ground_truth_path in sorted(GROUND_TRUTH_DIR.glob("label*.json")):
        payload = read_json_file(ground_truth_path)

        label_file = str(payload.get("label_file", ground_truth_path.name)).strip()

        results = payload.get("results", [])
        if not isinstance(results, list):
            logger.error("Skipping %s: results must be a list", ground_truth_path)
            continue

        indexed_results: GroundTruthByKey = {}
        for result in results:
            if not isinstance(result, dict):
                logger.error(
                    "Skipping %s: result entries must be objects", ground_truth_path
                )
                continue

            requirement_ref = result.get("requirement_ref", {})
            if not isinstance(requirement_ref, dict):
                requirement_ref = {}

            expected_explanation = result.get("expected_explanation", {})
            if not isinstance(expected_explanation, dict):
                expected_explanation = {}

            try:
                expected_status = normalize_compliance_status(
                    result.get("expected_status")
                )
            except ValueError as exc:
                logger.error("Invalid status in %s: %s", ground_truth_path, exc)
                continue

            expected = {
                "expected_status": expected_status,
                "expected_explanation_en": expected_explanation.get("en"),
                "expected_explanation_fr": expected_explanation.get("fr"),
            }

            citation = requirement_ref.get("citation")
            title = requirement_ref.get("title_en")
            if isinstance(citation, str) and citation.strip():
                indexed_results[f"citation::{citation.strip()}"] = expected
            if isinstance(title, str) and title.strip():
                indexed_results[f"title::{title.strip()}"] = expected

        index[label_file] = indexed_results

    return index
