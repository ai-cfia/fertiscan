"""Loader for extraction benchmark label references."""

import logging
import mimetypes
from pathlib import Path

from pydantic import ValidationError

from app.benchmark.core import (
    build_transient_label,
    read_json_file,
    split_payload,
    validate_label_payload,
)
from app.benchmark.extraction.tools.prescript import DATA_DIR, GROUND_TRUTH_DIR
from app.db.models.label import Label
from app.services.extraction import ImageData


def create_labels() -> list[tuple[str, Label]]:
    """Create Label references from ground truth for extraction targets.

    Loads ground truth fixtures and returns labels with names cleaned
    to match image directory names (e.g., "label_001" instead of "label_001.json").
    """
    labels: list[tuple[str, Label]] = []
    for path in sorted(GROUND_TRUTH_DIR.glob("*.json")):
        try:
            payload = read_json_file(path)
            extracted = validate_label_payload(payload)
            data = extracted.model_dump(mode="json")
            label_payload, fert_payload = split_payload(data)
            label = build_transient_label(label_payload, fert_payload)

            # Use directory-style name (without .json) for matching with images
            label_name = path.stem  # e.g., "label_001" from "label_001.json"
            labels.append((label_name, label))
        except (ValidationError, ValueError) as exc:
            logging.error("Skipping %s: %s", path, exc)
    return labels


def image_to_data(data_dir: Path = DATA_DIR) -> dict[str, list[ImageData]]:
    """Load image files grouped by label directory into ImageData objects."""

    images: dict[str, list[ImageData]] = {}
    for label_dir in sorted(path for path in data_dir.iterdir() if path.is_dir()):
        label_images: list[ImageData] = []

        for path in sorted(
            file_path for file_path in label_dir.iterdir() if file_path.is_file()
        ):
            content_type = mimetypes.guess_type(path.name)[0] or "image/jpeg"

            with path.open("rb") as file:
                label_images.append(ImageData(file.read(), content_type))

        if not label_images:
            continue

        images[label_dir.name] = label_images
    return images
