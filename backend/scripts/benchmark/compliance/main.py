import logging

from app.config import settings
from scripts.benchmark.compliance.prescript import prescript

logger = logging.getLogger(__name__)


def main():
    if not prescript():
        logger.error(
            "Prerequisites not met."
            " Please ensure all data and ground truth are available"
            " before running the compliance benchmark."
        )
        exit(1)
    logger.info("All prerequisites for the compliance benchmark are met.")

    calculate_number_of_requirements = len(
        settings.compliance_seed_data().get("requirements", [])
    )
    logger.info(f"Number of requirements loaded: {calculate_number_of_requirements}")

    with open("results/compliance_benchmark_results.txt", "w") as f:
        f.write(f"Number of requirements loaded: {calculate_number_of_requirements}\n")


if __name__ == "__main__":
    main()
