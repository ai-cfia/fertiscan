"""Shared abstract workflow for benchmark CLI scripts."""

import asyncio
import logging
from abc import ABC, abstractmethod

from app.schemas.prescript_result import PrescriptResult


class BenchmarkWorkflow(ABC):
    """Template method for benchmark CLI orchestration."""

    def __init__(self, *, logger: logging.Logger, benchmark_name: str) -> None:
        self._logger = logger
        self._benchmark_name = benchmark_name

    def main(self) -> None:
        """CLI entrypoint."""
        asyncio.run(self.run_async())

    async def run_async(self) -> None:
        """Asynchronous benchmark workflow."""

        self.configure_runtime()

        readiness = self.run_prescript()
        if not readiness.ok:
            self.log_prescript_result(readiness)
            raise SystemExit(1)

        self._logger.info("%s benchmark prerequisites met.", self._benchmark_name)
        await self.run_benchmark()

    def configure_runtime(self) -> None:
        """Hook for benchmark-specific runtime path configuration."""

        return None

    @abstractmethod
    def run_prescript(self) -> PrescriptResult:
        """Run benchmark prerequisite checks."""

    @abstractmethod
    async def run_benchmark(self) -> None:
        """Run benchmark-specific evaluation and reporting workflow."""

    def log_prescript_result(self, readiness: PrescriptResult) -> None:
        """Log a standardized prerequisite readiness summary."""

        self._logger.error("Prerequisites not met. Please review the following issues:")
        for message in readiness.errors:
            self._logger.error(message)
        for file_path in readiness.missing_data_files:
            self._logger.error("Missing data file: %s", file_path)
        for file_path in readiness.invalid_data_files:
            self._logger.error("Invalid data file: %s", file_path)
        for file_path in readiness.missing_ground_truth_files:
            self._logger.error("Missing ground truth file: %s", file_path)
        for message in readiness.warnings:
            self._logger.warning(message)
