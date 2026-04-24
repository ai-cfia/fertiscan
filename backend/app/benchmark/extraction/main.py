import logging
from pathlib import Path

from app.benchmark.core import BenchmarkWorkflow
from app.benchmark.extraction.tools import (
    create_labels,
    prescript,
    run_extraction_benchmark,
)
from app.benchmark.extraction.tools.loader import image_to_data
from app.controllers.labels.label_data_extraction import _EXTRACTION_PROMPT
from app.dependencies.instructor import get_instructor
from app.schemas.prescript_result import PrescriptResult

logger = logging.getLogger(__name__)

RESULTS_DIR = Path(__file__).parent / "results"
BACKEND_DIR = Path(__file__).resolve().parents[3]
RUN_ID = "extraction_benchmark_run"
REPORT_FILE_NAME = "extraction_benchmark_results.md"


class ExtractionBenchmarkWorkflow(BenchmarkWorkflow):
    """Extraction benchmark workflow implementation."""

    def __init__(self) -> None:
        super().__init__(logger=logger, benchmark_name="Extraction")

    def run_prescript(self) -> PrescriptResult:
        return prescript()

    async def run_benchmark(self) -> None:
        """Placeholder for extraction benchmark execution."""

        labels_truth = create_labels()
        logger.info("Loaded %s extraction label ground truth.", len(labels_truth))
        image_data = image_to_data()
        logger.info("Prepared image data for %s labels.", len(image_data))
        for img in image_data:
            logger.info(
                "Image data sample: %s with %s images", img[:100], len(image_data[img])
            )

        atomic_results_file = RESULTS_DIR / f"{RUN_ID}.jsonl"
        atomic_results_file.write_text("", encoding="utf-8")
        instructor_client = get_instructor()
        atomic_results = await run_extraction_benchmark(
            instructor_client=instructor_client,
            labels_truth=labels_truth,
            img=image_data,
            prompt=_EXTRACTION_PROMPT,
            atomic_results_file=atomic_results_file,
        )
        # TODO: Implement reporting logic to generate a markdown report from the atomic results.
        # write_markdown_report(atomic_results, RESULTS_DIR / REPORT_FILE_NAME)

        # TODO: After implementing the benchmark logic, remove this line.
        logger.info("Extraction benchmark execution is under construction.")


def main() -> None:
    """CLI entrypoint."""
    ExtractionBenchmarkWorkflow().main()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        force=True,
    )
    main()
