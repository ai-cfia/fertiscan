"""The prescript module checks before running the compliance benchmark"""

import json
import logging
from pathlib import Path

from pydantic import ValidationError

from app.schemas.label_data import ExtractFertilizerFieldsOutput

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"


def prescript() -> bool:
    """
    Check if all prerequisites for the compliance benchmark are met.
    This function can be expanded to check for specific dependencies, configurations, or environment variables.

    Returns:
        bool: True if all prerequisites are met, False otherwise.
    """
    if not check_data_availability():
        return False
    if not check_ground_truth_availability():
        return False
    return True


def check_data_availability() -> bool:
    """
    Check if the required data for the compliance benchmark is available.

    Returns:
        bool: True if data is available, False otherwise.
    """
    label_1 = DATA_DIR / "label1.json"
    label_2 = DATA_DIR / "label2.json"

    for label_path in (label_1, label_2):
        if not _validate_label_json(label_path):
            return False

    return True


def _validate_label_json(label_path: Path) -> bool:
    if not label_path.exists():
        logger.error("Missing label file: %s", label_path)
        return False

    if label_path.stat().st_size == 0:
        logger.error("Empty label file: %s", label_path)
        return False

    try:
        with label_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except json.JSONDecodeError as exc:
        logger.error("Invalid JSON in %s: %s", label_path, exc)
        return False

    if not isinstance(payload, dict):
        logger.error("Label payload must be a JSON object in %s", label_path)
        return False

    expected_fields = set(ExtractFertilizerFieldsOutput.model_fields.keys())
    missing_fields = sorted(expected_fields - set(payload.keys()))
    if missing_fields:
        logger.error(
            "Missing expected fields in %s: %s. Provide all keys (null is allowed).",
            label_path,
            ", ".join(missing_fields),
        )
        return False

    try:
        ExtractFertilizerFieldsOutput.model_validate(payload)
    except ValidationError as exc:
        logger.error("Schema validation failed for %s: %s", label_path, exc)
        return False

    return True


def check_ground_truth_availability() -> bool:
    """
    Check if the required ground truth data for the compliance benchmark is available.

    Returns:
        bool: True if ground truth data is available, False otherwise.
    """
    ground_truth = DATA_DIR / "ground_truth.json"
    return ground_truth.exists()
