"""Reporting helpers for the compliance benchmark."""

from collections import defaultdict
from pathlib import Path


def _update_accuracy_bucket(
    bucket: dict[str, int],
    *,
    is_comparable: bool,
    is_match: bool,
) -> None:
    bucket["total"] += 1
    if is_comparable:
        bucket["comparable"] += 1
        if is_match:
            bucket["matches"] += 1


def _accuracy_percent(comparable: int, matches: int) -> float:
    if comparable == 0:
        return 0.0
    return matches / comparable * 100.0


def _comparison_outcome(result: dict[str, object]) -> str:
    """Return a compact outcome label for one atomic result."""

    error = result.get("error")
    is_match = result.get("is_match")
    if isinstance(error, str) and error:
        return "error"
    if is_match is True:
        return "match"
    if is_match is False:
        return "mismatch"
    return "not_comparable"


def _requirement_key(result: dict[str, object]) -> str:
    """Build a stable and readable requirement label for logs."""

    citation = result.get("requirement_citation")
    title = result.get("requirement_title_en")
    if isinstance(citation, str) and citation:
        return citation
    if isinstance(title, str) and title:
        return title
    return "unknown"


def write_markdown_report(
    result_file: Path,
    atomic_results: list[dict[str, object]],
    number_of_requirements: int,
    number_of_labels: int,
    run_id: str,
    atomic_file_name: str,
) -> None:
    """Write the final markdown benchmark report from atomic results."""

    total = len(atomic_results)
    comparable = [
        result for result in atomic_results if result.get("is_match") is not None
    ]
    matches = sum(1 for result in comparable if result.get("is_match") is True)
    failures = sum(1 for result in atomic_results if result.get("error"))
    accuracy = (matches / len(comparable) * 100.0) if comparable else 0.0

    by_label: dict[str, dict[str, int]] = defaultdict(
        lambda: {"total": 0, "comparable": 0, "matches": 0}
    )
    for result in atomic_results:
        label_file = str(result.get("label_file"))
        is_match = result.get("is_match") is True
        is_comparable = result.get("is_match") is not None
        _update_accuracy_bucket(
            by_label[label_file],
            is_comparable=is_comparable,
            is_match=is_match,
        )

    by_requirement: dict[str, dict[str, int]] = defaultdict(
        lambda: {"total": 0, "comparable": 0, "matches": 0}
    )
    expected_status_counts: dict[str, int] = {}
    llm_status_counts: dict[str, int] = {}
    outcome_counts: dict[str, int] = {
        "match": 0,
        "mismatch": 0,
        "not_comparable": 0,
        "error": 0,
    }
    mismatch_or_error_rows: list[dict[str, object]] = []
    for result in atomic_results:
        requirement_key = _requirement_key(result)
        is_match = result.get("is_match") is True
        is_comparable = result.get("is_match") is not None
        _update_accuracy_bucket(
            by_requirement[requirement_key],
            is_comparable=is_comparable,
            is_match=is_match,
        )

        outcome = _comparison_outcome(result)
        outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1
        if outcome in {"mismatch", "error"}:
            mismatch_or_error_rows.append(result)

        expected_status = result.get("ground_truth_status")
        if isinstance(expected_status, str) and expected_status:
            expected_status_counts[expected_status] = (
                expected_status_counts.get(expected_status, 0) + 1
            )

        llm_status = result.get("llm_status")
        if isinstance(llm_status, str) and llm_status:
            llm_status_counts[llm_status] = llm_status_counts.get(llm_status, 0) + 1

    with result_file.open("w", encoding="utf-8") as file:
        file.write("# Compliance Benchmark Results\n\n")
        file.write(f"Run ID: {run_id}\n\n")
        file.write(f"Atomic results file: {atomic_file_name}\n\n")
        file.write(f"Number of requirements in database: {number_of_requirements}\n")
        file.write(f"Number of label files: {number_of_labels}\n")
        file.write(f"Total atomic evaluations: {total}\n")
        file.write(f"Comparable evaluations: {len(comparable)}\n")
        file.write(f"Successful matches: {matches}\n")
        file.write(f"Evaluation failures: {failures}\n")
        file.write(f"Global accuracy: {accuracy:.2f}%\n\n")

        file.write("## Outcome summary\n\n")
        file.write("| Outcome | Count |\n")
        file.write("| --- | ---: |\n")
        file.write(f"| match | {outcome_counts['match']} |\n")
        file.write(f"| mismatch | {outcome_counts['mismatch']} |\n")
        file.write(f"| not_comparable | {outcome_counts['not_comparable']} |\n")
        file.write(f"| error | {outcome_counts['error']} |\n")
        file.write("\n")

        file.write("## Accuracy by label\n\n")
        file.write("| Label | Comparable | Matches | Accuracy |\n")
        file.write("| --- | ---: | ---: | ---: |\n")
        for label_file, stats in sorted(by_label.items()):
            label_accuracy = _accuracy_percent(stats["comparable"], stats["matches"])
            file.write(
                f"| {label_file} | {stats['comparable']} | {stats['matches']} | {label_accuracy:.2f}% |\n"
            )

        file.write("\n## Accuracy by requirement\n\n")
        file.write("| Requirement | Comparable | Matches | Accuracy |\n")
        file.write("| --- | ---: | ---: | ---: |\n")
        for requirement_key, stats in sorted(by_requirement.items()):
            requirement_accuracy = _accuracy_percent(
                stats["comparable"],
                stats["matches"],
            )
            file.write(
                f"| {requirement_key} | {stats['comparable']} | {stats['matches']} | {requirement_accuracy:.2f}% |\n"
            )

        file.write("\n## Status coverage\n\n")
        file.write("### Ground truth expected statuses\n\n")
        if expected_status_counts:
            file.write("| Status | Count |\n")
            file.write("| --- | ---: |\n")
            for status, count in sorted(expected_status_counts.items()):
                file.write(f"| {status} | {count} |\n")
        else:
            file.write("No expected status values found in comparable entries.\n")

        file.write("\n### LLM predicted statuses\n\n")
        if llm_status_counts:
            file.write("| Status | Count |\n")
            file.write("| --- | ---: |\n")
            for status, count in sorted(llm_status_counts.items()):
                file.write(f"| {status} | {count} |\n")
        else:
            file.write("No predicted status values found.\n")

        file.write("\n## Comparison log (mismatch + error)\n\n")
        if mismatch_or_error_rows:
            file.write(
                "| Label | Requirement | Expected | Predicted | Outcome | Duration (ms) | Error |\n"
            )
            file.write("| --- | --- | --- | --- | --- | ---: | --- |\n")
            for result in mismatch_or_error_rows:
                label_file = str(result.get("label_file") or "")
                requirement = _requirement_key(result)
                expected = str(result.get("ground_truth_status") or "")
                predicted = str(result.get("llm_status") or "")
                outcome = _comparison_outcome(result)
                duration_ms = str(result.get("duration_ms") or "")
                error = str(result.get("error") or "")
                file.write(
                    f"| {label_file} | {requirement} | {expected} | {predicted} | {outcome} | {duration_ms} | {error or None} |\n"
                )
        else:
            file.write("No mismatch or error detected.\n")
