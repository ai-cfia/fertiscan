"""Shared abstract base for benchmark prescript checks."""

from abc import ABC, abstractmethod

from app.schemas.prescript_result import PrescriptResult


class BenchmarkPrescript(ABC):
    """Template method to run benchmark prerequisite checks."""

    def prescript(self) -> PrescriptResult:
        result = PrescriptResult()
        self.check_data_availability(result)
        self.check_ground_truth_availability(result)
        result.ok = not (
            result.errors
            or result.missing_data_files
            or result.invalid_data_files
            or result.missing_ground_truth_files
        )
        return result

    @abstractmethod
    def check_data_availability(self, result: PrescriptResult) -> None:
        """Validate benchmark data prerequisites."""

    @abstractmethod
    def check_ground_truth_availability(self, result: PrescriptResult) -> None:
        """Validate benchmark ground-truth prerequisites."""
