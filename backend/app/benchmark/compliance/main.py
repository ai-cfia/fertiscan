"""Compliance benchmark CLI entrypoint and workflow orchestration."""

import logging
from pathlib import Path

from app.benchmark.compliance.tools import (
    create_labels,
    isolate_requirements_by_id,
    load_ground_truth_index,
    prescript,
    run_compliance_benchmark,
    write_markdown_report,
)
from app.benchmark.core import BenchmarkWorkflow
from app.config import settings
from app.dependencies.instructor import get_instructor
from app.schemas.prescript_result import PrescriptResult

logger = logging.getLogger(__name__)

RESULTS_DIR = Path(__file__).parent / "results"
BACKEND_DIR = Path(__file__).resolve().parents[3]
RUN_ID = "compliance_benchmark_run"
REPORT_FILE_NAME = "compliance_benchmark_results.md"


class ComplianceBenchmarkWorkflow(BenchmarkWorkflow):
    """Compliance benchmark workflow implementation."""

    def __init__(self) -> None:
        super().__init__(logger=logger, benchmark_name="Compliance")

    def configure_runtime(self) -> None:
        """Resolve benchmark runtime paths so execution is stable from any CWD."""

        template_dir = Path(settings.PROMPT_TEMPLATES_DIR)
        if not template_dir.is_absolute():
            settings.PROMPT_TEMPLATES_DIR = str(BACKEND_DIR / template_dir)

    def run_prescript(self) -> PrescriptResult:
        return prescript()

    async def run_benchmark(self) -> None:
        requirements = isolate_requirements_by_id()
        requirement_count = len(requirements)

        logger.info(
            "Number of requirements in database: %s",
            requirement_count,
        )

        RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        result_file = RESULTS_DIR / REPORT_FILE_NAME
        labels = create_labels()
        logger.info("Created %s labels from data files.", len(labels))
        ground_truth_lookup = load_ground_truth_index()
        logger.info(
            "Loaded ground truth for %s label files.",
            len(ground_truth_lookup),
        )

        atomic_results_file = RESULTS_DIR / f"{RUN_ID}.jsonl"
        atomic_results_file.write_text("", encoding="utf-8")
        instructor_client = get_instructor()
        atomic_results = await run_compliance_benchmark(
            requirements=requirements,
            labels=labels,
            instructor_client=instructor_client,
            ground_truth_lookup=ground_truth_lookup,
            atomic_results_path=atomic_results_file,
            run_id=RUN_ID,
        )
        logger.info("Evaluated %s atomic requirement checks.", len(atomic_results))

        write_markdown_report(
            result_file=result_file,
            atomic_results=atomic_results,
            number_of_requirements=requirement_count,
            number_of_labels=len(labels),
            run_id=RUN_ID,
            atomic_file_name=atomic_results_file.name,
        )
        logger.info("Benchmark report written to %s", result_file)


def main() -> None:
    """CLI entrypoint."""
    ComplianceBenchmarkWorkflow().main()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        force=True,
    )
    main()
