import logging
from pathlib import Path

from sqlalchemy import func
from sqlmodel import select

from app.db.models.requirement import Requirement
from app.db.session import get_sessionmaker
from scripts.benchmark.compliance.prescript import prescript

logger = logging.getLogger(__name__)

RESULTS_DIR = Path(__file__).parent / "results"


def main():
    if not prescript():
        logger.error(
            "Prerequisites not met."
            " Please ensure all data and ground truth are available"
            " before running the compliance benchmark."
        )
        exit(1)
    logger.info("All prerequisites for the compliance benchmark are met.")

    with get_sessionmaker()() as session:
        calculate_number_of_requirements = int(
            session.exec(select(func.count()).select_from(Requirement)).one()
        )

    logger.info(
        "Number of requirements in database: %s",
        calculate_number_of_requirements,
    )

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    result_file = RESULTS_DIR / "compliance_benchmark_results.md"
    with result_file.open("w", encoding="utf-8") as f:
        f.write(
            "# Compliance Benchmark Results\n\n"
            f"Number of requirements in database: {calculate_number_of_requirements}\n"
        )


if __name__ == "__main__":
    main()
