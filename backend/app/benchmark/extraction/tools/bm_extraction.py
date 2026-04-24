"""Benchmark file for the extraction task."""

import logging
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

import instructor

from app.db.models.enums import ReviewStatus
from app.db.models.fertilizer_label_data import FertilizerLabelData
from app.db.models.label import Label
from app.db.models.label_data import LabelData
from app.schemas.label_data import ExtractFertilizerFieldsOutput
from app.services.extraction import ImageData, extract_fields_from_images


async def run_extraction_benchmark(
    instructor_client: instructor.AsyncInstructor,
    labels_truth: list[tuple[str, Label]],
    img: dict[str, list[ImageData]],
    prompt: str,
    atomic_results_file: Path,
) -> list[dict[str, object]]:
    """Run the extraction benchmark with the given parameters."""

    llm_results = await extractions(instructor_client, labels_truth, img, prompt)
    logging.info(f"Extraction with LLM  : {len(llm_results)} results.")
    llm_labels = convert_results_to_labels(llm_results)
    logging.info("Converted LLM results to Label objects.")
    results = compare_llm_results_to_ground_truth(llm_labels, labels_truth)

    # Persist results to atomic file
    atomic_result_dicts = []
    with atomic_results_file.open("a", encoding="utf-8") as f:
        for label_name, result in results:
            result_dict = {"label_name": label_name, **result}
            f.write(f"{label_name}|{str(result_dict)}\n")
            atomic_result_dicts.append(result_dict)

    return atomic_result_dicts


async def extractions(
    instructor_client: instructor.AsyncInstructor,
    labels_truth: list[tuple[str, Label]],
    img: dict[str, list[ImageData]],
    prompt: str,
) -> list[tuple[str, ExtractFertilizerFieldsOutput]]:
    """Run extraction for each label and its images."""
    results = []
    for label_name, _label in labels_truth:
        # Label names are already cleaned (e.g., "label_001") to match image directory keys
        images = img.get(label_name, [])
        if not images:
            logging.warning(f"No images found for label {label_name}. Skipping.")
            continue
        try:
            result, _ = await extract_fields_from_images(
                images=images,
                model=ExtractFertilizerFieldsOutput,
                prompt=prompt,
                instructor=instructor_client,
            )
            results.append((label_name, result))
        except Exception as e:
            logging.error(f"Error extracting fields for label {label_name}: {e}")
    return results


def convert_results_to_labels(
    llm_results: list[tuple[str, ExtractFertilizerFieldsOutput]],
) -> list[tuple[str, Label]]:
    """Convert LLM extraction results to Label objects."""
    converted = []
    for label_name, extraction_result in llm_results:
        try:
            label = build_label_from_extraction(extraction_result)
            converted.append((label_name, label))
        except Exception as e:
            logging.error(f"Error converting extraction result for {label_name}: {e}")
    return converted


def build_label_from_extraction(extraction: ExtractFertilizerFieldsOutput) -> Label:
    """Build a transient Label object from extraction results."""
    label_id = uuid4()

    # Create label data payload from extraction fields
    label_data_payload = {
        "brand_name": extraction.brand_name,
        "product_name": extraction.product_name,
        "registration_number": extraction.registration_number,
        "country_of_origin": extraction.country_of_origin,
    }

    # Create fertilizer data payload
    fert_payload = {
        "contacts": extraction.contacts,
        "registration_claim": extraction.registration_claim,
        "lot_number": extraction.lot_number,
        "net_weight": extraction.net_weight,
        "volume": extraction.volume,
        "exemption_claim": extraction.exemption_claim,
        "product_classification": extraction.product_classification,
    }

    label_data = LabelData(label_id=label_id, **label_data_payload)
    fertilizer_data = FertilizerLabelData(label_id=label_id, **fert_payload)

    return Label(
        id=label_id,
        product_type_id=uuid4(),
        created_by_id=uuid4(),
        review_status=ReviewStatus.not_started,
        label_data=label_data,
        fertilizer_label_data=fertilizer_data,
    )


def compare_llm_results_to_ground_truth(
    llm_labels: list[tuple[str, Label]],
    ground_truth_labels: list[tuple[str, Label]],
) -> list[tuple[str, dict[str, object]]]:
    """Compare LLM extraction results against ground truth labels."""
    results = []
    ground_truth_dict = dict(ground_truth_labels)

    for label_name, llm_label in llm_labels:
        ground_truth_label = ground_truth_dict.get(label_name)
        if not ground_truth_label:
            logging.warning(
                f"No ground truth found for {label_name}. Skipping comparison."
            )
            continue

        total_match = _isolated_llm_compare_to_ground_truth(
            llm_label, ground_truth_label
        )
        result = {
            "percentage of equivalence": total_match,
            "match": total_match >= Decimal("0.9"),
            "llm_label": llm_label,
            "ground_truth_label": ground_truth_label,
        }
        results.append((label_name, result))

    return results


def _isolated_llm_compare_to_ground_truth(
    llm_label: Label, ground_truth_label: Label
) -> Decimal:
    """Isolated comparison logic for LLM label vs. ground truth label."""
    total_fields: Decimal = Decimal(len(LabelData.model_fields)) + Decimal(
        len(FertilizerLabelData.model_fields)
    )
    score: Decimal = Decimal("0.00")

    for field_name in LabelData.model_fields:
        llm_value = getattr(llm_label.label_data, field_name)
        gt_value = getattr(ground_truth_label.label_data, field_name)
        score += _compare_field_value(llm_value, gt_value)

    for field_name in FertilizerLabelData.model_fields:
        llm_value = getattr(llm_label.fertilizer_label_data, field_name)
        gt_value = getattr(ground_truth_label.fertilizer_label_data, field_name)
        score += _compare_field_value(llm_value, gt_value)

    if total_fields > 0:
        return score / total_fields
    return Decimal("0")


# TODO: Implement comparison logic to compare individual field values with
# appropriate handling for different data types (e.g., strings, numbers, lists).
def _compare_field_value(llm_value: object, gt_value: object) -> Decimal:
    """Compare two field values and return a score between 0 and 1."""

    logging.warning(
        "Field comparison logic is not implemented. Returning 0 for all comparisons."
    )
    return Decimal("0.00")
