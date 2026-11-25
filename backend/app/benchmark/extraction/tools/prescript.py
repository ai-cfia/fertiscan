"""Pre-run checks for the extraction benchmark."""

import json
import logging
from pathlib import Path

from pydantic import ValidationError

from app.benchmark.core import BenchmarkPrescript
from app.schemas.label_data import ExtractFertilizerFieldsOutput
from app.schemas.prescript_result import PrescriptResult

logger = logging.getLogger(__name__)

EXTRACTION_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = EXTRACTION_DIR / "data"
GROUND_TRUTH_DIR = EXTRACTION_DIR / "ground_truth"

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


class ExtractionPrescript(BenchmarkPrescript):
    """Extraction-specific implementation of shared prescript workflow."""

    def check_data_availability(self, result: PrescriptResult) -> None:
        result.checked_paths.append(str(DATA_DIR))
        label_dirs = sorted(path for path in DATA_DIR.iterdir() if path.is_dir())

        if not label_dirs:
            message = f"No label directories found in {DATA_DIR}"
            _record_error(result, message)
            result.missing_data_files.append(str(DATA_DIR))
            return

        for label_dir in label_dirs:
            result.checked_paths.append(str(label_dir))
            image_paths = sorted(path for path in label_dir.iterdir() if path.is_file())

            if not image_paths:
                message = f"No image files found in label directory: {label_dir}"
                _record_error(result, message)
                result.missing_data_files.append(str(label_dir))
                continue

            if len(image_paths) > 5:
                message = (
                    f"Label directory {label_dir.name} contains {len(image_paths)} images. "
                    "Maximum allowed is 5."
                )
                _record_error(result, message)
                result.invalid_data_files.append(str(label_dir))

            for image_path in image_paths:
                result.checked_paths.append(str(image_path))
                if image_path.suffix.lower() in ALLOWED_IMAGE_EXTENSIONS:
                    continue

                message = (
                    f"Unsupported label file extension for {image_path.name}. "
                    f"Allowed: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
                )
                _record_error(result, message)
                result.invalid_data_files.append(str(image_path))

    def check_ground_truth_availability(self, result: PrescriptResult) -> None:
        result.checked_paths.append(str(GROUND_TRUTH_DIR))
        label_dirs = sorted(path for path in DATA_DIR.iterdir() if path.is_dir())

        if not label_dirs:
            message = f"No label directories found in {DATA_DIR}"
            _record_error(result, message)
            result.missing_ground_truth_files.append(str(GROUND_TRUTH_DIR))
            return

        for label_dir in label_dirs:
            ground_truth_path = GROUND_TRUTH_DIR / f"{label_dir.name}.json"
            result.checked_paths.append(str(ground_truth_path))
            _validate_ground_truth_json(label_dir.name, ground_truth_path, result)


def prescript() -> PrescriptResult:
    """Return a structured readiness report for benchmark prerequisites."""
    return ExtractionPrescript().prescript()


def check_data_availability(result: PrescriptResult) -> None:
    """Compatibility wrapper for extraction data checks."""
    ExtractionPrescript().check_data_availability(result)


def check_ground_truth_availability(result: PrescriptResult) -> None:
    """Compatibility wrapper for extraction ground-truth checks."""
    ExtractionPrescript().check_ground_truth_availability(result)


def _validate_ground_truth_json(
    label_name: str,
    ground_truth_path: Path,
    result: PrescriptResult,
) -> bool:
    if not ground_truth_path.exists():
        message = f"Missing ground truth file for {label_name}: {ground_truth_path}"
        _record_error(result, message)
        result.missing_ground_truth_files.append(str(ground_truth_path))
        return False

    if ground_truth_path.stat().st_size == 0:
        message = f"Empty ground truth file: {ground_truth_path}"
        _record_error(result, message)
        result.missing_ground_truth_files.append(str(ground_truth_path))
        return False

    try:
        with ground_truth_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except json.JSONDecodeError as exc:
        message = f"Invalid JSON in ground truth file {ground_truth_path}: {exc}"
        _record_error(result, message)
        result.missing_ground_truth_files.append(str(ground_truth_path))
        return False

    if not isinstance(payload, dict):
        message = f"Ground truth payload must be a JSON object in {ground_truth_path}"
        _record_error(result, message)
        result.missing_ground_truth_files.append(str(ground_truth_path))
        return False

    label_file = payload.get("label_file")
    if label_file != label_name:
        message = (
            f"Ground truth file {ground_truth_path} must declare "
            f"label_file={label_name}"
        )
        _record_error(result, message)
        result.missing_ground_truth_files.append(str(ground_truth_path))
        return False

    expected_fields = set(ExtractFertilizerFieldsOutput.model_fields.keys())
    missing_fields = sorted(expected_fields - set(payload.keys()))
    if missing_fields:
        message = (
            f"Missing expected fields in {ground_truth_path}: {', '.join(missing_fields)}. "
            "Provide all keys (null is allowed)."
        )
        _record_error(result, message)
        result.invalid_data_files.append(str(ground_truth_path))
        return False

    try:
        ExtractFertilizerFieldsOutput.model_validate(payload)
    except ValidationError as exc:
        message = f"Schema validation failed for {ground_truth_path}: {exc}"
        _record_error(result, message)
        result.invalid_data_files.append(str(ground_truth_path))
        return False
    return True


def _record_error(result: PrescriptResult, message: str) -> None:
    logger.error(message)
    result.errors.append(message)
