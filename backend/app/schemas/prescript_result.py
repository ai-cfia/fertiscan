"""Schema for the result of running a prescript check for benchmark."""

from pydantic import BaseModel, Field


class PrescriptResult(BaseModel):
    ok: bool = False
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    missing_data_files: list[str] = Field(default_factory=list)
    invalid_data_files: list[str] = Field(default_factory=list)
    missing_ground_truth_files: list[str] = Field(default_factory=list)
    checked_paths: list[str] = Field(default_factory=list)
