"""Evaluation helpers for the compliance benchmark."""

import json
from enum import Enum
from pathlib import Path
from time import perf_counter

from instructor import AsyncInstructor

from app.db.models.label import Label
from app.db.models.requirement import Requirement
from app.schemas.label import ComplianceResult
from app.services.compliance import evaluate_requirement


def _status_to_text(value: object) -> str | None:
    """Convert status-like values to persisted string form."""

    if value is None:
        return None
    if isinstance(value, Enum):
        return str(value.value)
    return str(value)


def _requirement_lookup_keys(requirement: Requirement) -> list[str]:
    """Build possible keys used to map requirement to ground truth entries."""

    keys: list[str] = []
    if requirement.title_en:
        keys.append(f"title::{requirement.title_en.strip()}")

    citations = sorted(
        {
            provision.citation.strip()
            for provision in requirement.provisions
            if getattr(provision, "citation", None)
        }
    )
    keys.extend(f"citation::{citation}" for citation in citations)
    return keys


def _match_ground_truth_result(
    ground_truth_lookup: dict[str, dict[str, dict[str, str | None]]],
    label_file: str,
    requirement: Requirement,
) -> dict[str, str | None] | None:
    """Return matched ground truth payload for a requirement, if present."""

    label_ground_truth = ground_truth_lookup.get(label_file, {})
    for key in _requirement_lookup_keys(requirement):
        if key in label_ground_truth:
            return label_ground_truth[key]
    return None


def append_atomic_result(result_path: Path, result: dict[str, object]) -> None:
    """Append one atomic benchmark evaluation result as a JSONL line."""

    is_match = result.get("is_match")
    error = result.get("error")
    if isinstance(error, str) and error:
        outcome = "error"
    elif is_match is True:
        outcome = "match"
    elif is_match is False:
        outcome = "mismatch"
    else:
        outcome = "not_comparable"

    with result_path.open("a", encoding="utf-8") as file:
        json.dump(
            {
                "run": {
                    "id": result.get("run_id"),
                },
                "label": {
                    "file": result.get("label_file"),
                },
                "requirement": {
                    "id": result.get("requirement_id"),
                    "citation": result.get("requirement_citation"),
                    "title_en": result.get("requirement_title_en"),
                },
                "ground_truth": {
                    "status": result.get("ground_truth_status"),
                    "explanation": {
                        "en": result.get("ground_truth_explanation_en"),
                        "fr": result.get("ground_truth_explanation_fr"),
                    },
                },
                "llm": {
                    "status": result.get("llm_status"),
                    "explanation": {
                        "en": result.get("llm_explanation_en"),
                        "fr": result.get("llm_explanation_fr"),
                    },
                },
                "comparison": {
                    "is_match": is_match,
                    "outcome": outcome,
                },
                "execution": {
                    "duration_ms": result.get("duration_ms"),
                    "error": error,
                },
            },
            file,
            ensure_ascii=True,
        )
        file.write("\n")


def _get_requirement_citation(requirement: Requirement) -> str | None:
    if not requirement.provisions:
        return None

    sorted_provisions = sorted(
        requirement.provisions,
        key=lambda provision: provision.citation,
    )
    return sorted_provisions[0].citation


def _build_atomic_result(
    *,
    run_id: str,
    label_file: str,
    requirement: Requirement,
    expected: dict[str, str | None] | None,
) -> dict[str, object]:
    return {
        "run_id": run_id,
        "label_file": label_file,
        "requirement_id": str(requirement.id),
        "requirement_title_en": requirement.title_en,
        "requirement_citation": _get_requirement_citation(requirement),
        "llm_status": None,
        "llm_explanation_en": None,
        "llm_explanation_fr": None,
        "ground_truth_status": expected.get("expected_status") if expected else None,
        "ground_truth_explanation_en": (
            expected.get("expected_explanation_en") if expected else None
        ),
        "ground_truth_explanation_fr": (
            expected.get("expected_explanation_fr") if expected else None
        ),
        "is_match": None,
        "error": None,
        "duration_ms": 0,
    }


async def _run_atomic_evaluation(
    instructor_client: AsyncInstructor,
    label: Label,
    requirement: Requirement,
    result: dict[str, object],
    expected: dict[str, str | None] | None,
) -> None:
    compliance_result = await evaluate_isolated_requirement(
        instructor_client,
        label,
        requirement,
    )
    llm_status = _status_to_text(compliance_result.status)
    result["llm_status"] = llm_status
    result["llm_explanation_en"] = compliance_result.explanation.en
    result["llm_explanation_fr"] = compliance_result.explanation.fr
    if expected and expected.get("expected_status"):
        result["is_match"] = llm_status == expected["expected_status"]


async def _evaluate_requirement_worker(
    instructor_client: AsyncInstructor,
    label_file: str,
    label: Label,
    requirement: Requirement,
    ground_truth_lookup: dict[str, dict[str, dict[str, str | None]]],
    atomic_results_path: Path,
    run_id: str,
) -> dict[str, object]:
    started_at = perf_counter()
    expected = _match_ground_truth_result(
        ground_truth_lookup,
        label_file,
        requirement,
    )
    result = _build_atomic_result(
        run_id=run_id,
        label_file=label_file,
        requirement=requirement,
        expected=expected,
    )

    try:
        await _run_atomic_evaluation(
            instructor_client=instructor_client,
            label=label,
            requirement=requirement,
            result=result,
            expected=expected,
        )
    except Exception as exc:
        result["error"] = str(exc)

    result["duration_ms"] = int((perf_counter() - started_at) * 1000)
    append_atomic_result(atomic_results_path, result)
    return result


async def _evaluate_label_worker(
    requirements: list[Requirement],
    label_file: str,
    label: Label,
    instructor_client: AsyncInstructor,
    ground_truth_lookup: dict[str, dict[str, dict[str, str | None]]],
    atomic_results_path: Path,
    run_id: str,
) -> list[dict[str, object]]:
    label_results: list[dict[str, object]] = []
    for requirement in requirements:
        label_results.append(
            await _evaluate_requirement_worker(
                instructor_client=instructor_client,
                label_file=label_file,
                label=label,
                requirement=requirement,
                ground_truth_lookup=ground_truth_lookup,
                atomic_results_path=atomic_results_path,
                run_id=run_id,
            )
        )
    return label_results


async def evaluate_isolated_requirement(
    instructor_client: AsyncInstructor,
    label: Label,
    requirement: Requirement,
) -> ComplianceResult:
    """Evaluate a single requirement using the provided label."""

    return await evaluate_requirement(instructor_client, label, requirement)


async def run_compliance_benchmark(
    requirements: list[Requirement],
    labels: list[tuple[str, Label]],
    instructor_client: AsyncInstructor,
    ground_truth_lookup: dict[str, dict[str, dict[str, str | None]]],
    atomic_results_path: Path,
    run_id: str,
) -> list[dict[str, object]]:
    """Run the compliance benchmark and stream atomic results to JSONL."""

    all_results: list[dict[str, object]] = []
    for label_file, label in labels:
        label_results = await _evaluate_label_worker(
            requirements=requirements,
            label_file=label_file,
            label=label,
            instructor_client=instructor_client,
            ground_truth_lookup=ground_truth_lookup,
            atomic_results_path=atomic_results_path,
            run_id=run_id,
        )
        all_results.extend(label_results)

    return all_results
