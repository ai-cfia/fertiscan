"""Pre-run checks for the compliance benchmark."""

import json
import logging
from pathlib import Path

from pydantic import ValidationError

from app.benchmark.compliance.tools.status import (
    compliance_status_values,
    normalize_compliance_status,
)
from app.benchmark.core import BenchmarkPrescript
from app.schemas.label_data import ExtractFertilizerFieldsOutput
from app.schemas.prescript_result import PrescriptResult

logger = logging.getLogger(__name__)

COMPLIANCE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = COMPLIANCE_DIR / "data"
GROUND_TRUTH_DIR = COMPLIANCE_DIR / "ground_truth"

__all__ = ["DATA_DIR", "GROUND_TRUTH_DIR", "PrescriptResult", "prescript"]


def prescript() -> PrescriptResult:
    """Return a structured readiness report for benchmark prerequisites."""
    return CompliancePrescript().prescript()


class CompliancePrescript(BenchmarkPrescript):
    """Compliance-specific implementation of shared prescript workflow."""

    def check_data_availability(self, result: PrescriptResult) -> None:
        """Validate benchmark label fixtures in the data directory."""
        result.checked_paths.append(str(DATA_DIR))
        label_paths = sorted(DATA_DIR.glob("label*.json"))

        if not label_paths:
            message = f"No label JSON files found in {DATA_DIR}"
            _record_error(result, message)
            result.missing_data_files.append("label*.json")
            return

        for label_path in label_paths:
            result.checked_paths.append(str(label_path))
            _validate_label_json(label_path, result)

    def check_ground_truth_availability(self, result: PrescriptResult) -> None:
        """Validate benchmark ground truth files aligned with the label fixtures."""
        result.checked_paths.append(str(GROUND_TRUTH_DIR))
        label_paths = sorted(DATA_DIR.glob("label*.json"))

        if not label_paths:
            message = f"No label JSON files found in {DATA_DIR}"
            _record_error(result, message)
            result.missing_ground_truth_files.append(str(GROUND_TRUTH_DIR))
            return

        statuses_seen: set[str] = set()

        for label_path in label_paths:
            ground_truth_path = GROUND_TRUTH_DIR / label_path.name
            result.checked_paths.append(str(ground_truth_path))
            _validate_ground_truth_json(ground_truth_path, result, statuses_seen)

        allowed_statuses = compliance_status_values()
        missing_statuses = sorted(allowed_statuses - statuses_seen)
        if missing_statuses:
            result.warnings.append(
                "Ground truth status coverage is incomplete. "
                f"Missing statuses: {', '.join(missing_statuses)}"
            )


def _validate_label_json(label_path: Path, result: PrescriptResult) -> bool:
    if not label_path.exists():
        message = f"Missing label file: {label_path}"
        _record_error(result, message)
        result.missing_data_files.append(str(label_path))
        return False

    if label_path.stat().st_size == 0:
        message = f"Empty label file: {label_path}"
        _record_error(result, message)
        result.invalid_data_files.append(str(label_path))
        return False

    try:
        with label_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except json.JSONDecodeError as exc:
        message = f"Invalid JSON in {label_path}: {exc}"
        _record_error(result, message)
        result.invalid_data_files.append(str(label_path))
        return False

    if not isinstance(payload, dict):
        message = f"Label payload must be a JSON object in {label_path}"
        _record_error(result, message)
        result.invalid_data_files.append(str(label_path))
        return False

    expected_fields = set(ExtractFertilizerFieldsOutput.model_fields.keys())
    missing_fields = sorted(expected_fields - set(payload.keys()))
    if missing_fields:
        message = (
            f"Missing expected fields in {label_path}: {', '.join(missing_fields)}. "
            "Provide all keys (null is allowed)."
        )
        _record_error(result, message)
        result.invalid_data_files.append(str(label_path))
        return False

    try:
        ExtractFertilizerFieldsOutput.model_validate(payload)
    except ValidationError as exc:
        message = f"Schema validation failed for {label_path}: {exc}"
        _record_error(result, message)
        result.invalid_data_files.append(str(label_path))
        return False

    return True


def _validate_ground_truth_json(
    ground_truth_path: Path,
    result: PrescriptResult,
    statuses_seen: set[str],
) -> bool:
    if not ground_truth_path.exists():
        message = f"Missing ground truth file: {ground_truth_path}"
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

    expected_label_file = ground_truth_path.name
    label_file = payload.get("label_file")
    if label_file != expected_label_file:
        message = f"Ground truth file {ground_truth_path} must declare label_file={expected_label_file}"
        _record_error(result, message)
        result.missing_ground_truth_files.append(str(ground_truth_path))
        return False

    results = payload.get("results")
    if not isinstance(results, list):
        message = f"Ground truth results must be a list in {ground_truth_path}"
        _record_error(result, message)
        result.missing_ground_truth_files.append(str(ground_truth_path))
        return False

    allowed_statuses = compliance_status_values()
    payload_changed = False
    for idx, entry in enumerate(results):
        if not isinstance(entry, dict):
            message = (
                f"Ground truth entry at index {idx} must be an object in "
                f"{ground_truth_path}"
            )
            _record_error(result, message)
            result.missing_ground_truth_files.append(str(ground_truth_path))
            return False

        requirement_ref = entry.get("requirement_ref")
        if not isinstance(requirement_ref, dict):
            message = (
                f"Missing requirement_ref object at index {idx} in {ground_truth_path}"
            )
            _record_error(result, message)
            result.missing_ground_truth_files.append(str(ground_truth_path))
            return False

        citation = requirement_ref.get("citation")
        title_en = requirement_ref.get("title_en")
        if not isinstance(citation, str) or not citation.strip():
            message = (
                f"Missing requirement_ref.citation at index {idx} in "
                f"{ground_truth_path}"
            )
            _record_error(result, message)
            result.missing_ground_truth_files.append(str(ground_truth_path))
            return False

        if not isinstance(title_en, str) or not title_en.strip():
            message = (
                f"Missing requirement_ref.title_en at index {idx} in "
                f"{ground_truth_path}"
            )
            _record_error(result, message)
            result.missing_ground_truth_files.append(str(ground_truth_path))
            return False

        status_raw = entry.get("expected_status")
        if not isinstance(status_raw, str) or not status_raw.strip():
            message = (
                f"Missing expected_status at index {idx} in {ground_truth_path}. "
                f"Allowed values: {', '.join(sorted(allowed_statuses))}"
            )
            _record_error(result, message)
            result.missing_ground_truth_files.append(str(ground_truth_path))
            return False

        try:
            canonical_status = normalize_compliance_status(status_raw)
        except ValueError as exc:
            message = (
                f"Invalid expected_status at index {idx} in {ground_truth_path}: {exc}"
            )
            _record_error(result, message)
            result.missing_ground_truth_files.append(str(ground_truth_path))
            return False

        if canonical_status is not None and status_raw != canonical_status:
            entry["expected_status"] = canonical_status
            payload_changed = True

        if canonical_status is not None:
            statuses_seen.add(canonical_status)

    if payload_changed:
        with ground_truth_path.open("w", encoding="utf-8") as file:
            json.dump(payload, file, ensure_ascii=True, indent=4)
            file.write("\n")
        result.warnings.append(
            f"Normalized expected_status values in {ground_truth_path.name}"
        )

    return True


def _record_error(result: PrescriptResult, message: str) -> None:
    logger.error(message)
    result.errors.append(message)
