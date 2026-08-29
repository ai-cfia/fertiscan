"""Loaders for compliance benchmark inputs and ground truth."""

import logging
from pathlib import Path

from app.benchmark.compliance.tools.prescript import DATA_DIR, GROUND_TRUTH_DIR
from app.benchmark.compliance.tools.status import normalize_compliance_status
from app.benchmark.core import create_labels_from_dir, read_json_file
from app.db.models.label import Label

logger = logging.getLogger(__name__)

GroundTruthByKey = dict[str, dict[str, str | None]]
GroundTruthIndex = dict[str, GroundTruthByKey]


def create_labels(data_dir: Path = DATA_DIR) -> list[tuple[str, Label]]:
    """Load label fixtures from a directory into transient Label objects."""

    return create_labels_from_dir(data_dir, pattern="label*.json")


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
