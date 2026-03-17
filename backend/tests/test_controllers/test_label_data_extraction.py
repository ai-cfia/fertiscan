"""Tests for label data extraction controller helpers."""

from unittest.mock import AsyncMock

import pytest
from instructor.core.exceptions import InstructorRetryException

from app.controllers.labels import label_data_extraction
from app.controllers.labels.label_data_extraction import _sanitize_output_payload
from app.db.models import UploadStatus
from tests.factories.label import LabelFactory
from tests.factories.label_image import LabelImageFactory


class TestSanitizeOutputPayload:
    """Tests for payload sanitation behavior."""

    def test_keeps_guaranteed_analysis_with_title_only(self) -> None:
        payload = {
            "guaranteed_analysis": {
                "title": {"en": None, "fr": "Analyse minimale garantie"},
                "is_minimum": True,
                "nutrients": [],
            }
        }

        sanitized = _sanitize_output_payload(payload)
        guaranteed = sanitized["guaranteed_analysis"]

        assert isinstance(guaranteed, dict)
        assert guaranteed["title"] == {
            "en": None,
            "fr": "Analyse minimale garantie",
        }
        assert guaranteed["is_minimum"] is True
        assert guaranteed["nutrients"] == []

    def test_infers_is_minimum_from_french_title(self) -> None:
        payload = {
            "guaranteed_analysis": {
                "title": {"en": None, "fr": "Analyse minimale garantie"},
                "is_minimum": None,
                "nutrients": [],
            }
        }

        sanitized = _sanitize_output_payload(payload)
        guaranteed = sanitized["guaranteed_analysis"]

        assert isinstance(guaranteed, dict)
        assert guaranteed["is_minimum"] is True

    def test_infers_is_minimum_false_from_non_minimum_title(self) -> None:
        payload = {
            "guaranteed_analysis": {
                "title": {"en": "Guaranteed Analysis", "fr": "Analyse garantie"},
                "is_minimum": None,
                "nutrients": [],
            }
        }

        sanitized = _sanitize_output_payload(payload)
        guaranteed = sanitized["guaranteed_analysis"]

        assert isinstance(guaranteed, dict)
        assert guaranteed["is_minimum"] is False

    def test_parses_flat_guaranteed_analysis_map(self) -> None:
        payload = {
            "guaranteed_analysis": {
                "Total Nitrogen (N)": "0.09%",
                "Available Phosphate (P2O5)": "0.06%",
                "Soluble Potash (K2O)": "0.06%",
            }
        }

        sanitized = _sanitize_output_payload(payload)
        guaranteed = sanitized["guaranteed_analysis"]

        assert isinstance(guaranteed, dict)
        assert guaranteed["title"] == {
            "en": "Guaranteed Analysis",
            "fr": "Analyse garantie",
        }
        assert guaranteed["is_minimum"] is False
        assert isinstance(guaranteed["nutrients"], list)
        assert len(guaranteed["nutrients"]) == 3
        assert guaranteed["nutrients"][0]["name"]["en"] == "Total Nitrogen (N)"
        assert guaranteed["nutrients"][0]["value"] == "0.09"
        assert guaranteed["nutrients"][0]["unit"] == "%"

    def test_parses_string_title_and_amount_nutrients(self) -> None:
        payload = {
            "guaranteed_analysis": {
                "title": "Guaranteed Minimum Analysis",
                "is_minimum": True,
                "nutrients": [
                    {"name": "Total Nitrogen (N)", "amount": "0.09%"},
                    {"name": "Available Phosphate (P2O5)", "amount": "0.06%"},
                ],
            }
        }

        sanitized = _sanitize_output_payload(payload)
        guaranteed = sanitized["guaranteed_analysis"]

        assert isinstance(guaranteed, dict)
        assert guaranteed["title"]["en"] == "Guaranteed Minimum Analysis"
        assert guaranteed["is_minimum"] is True
        assert len(guaranteed["nutrients"]) == 2
        assert guaranteed["nutrients"][0]["name"]["en"] == "Total Nitrogen (N)"
        assert guaranteed["nutrients"][0]["value"] == "0.09"
        assert guaranteed["nutrients"][0]["unit"] == "%"


@pytest.mark.asyncio
async def test_extract_fertilizer_fields_handles_instructor_retry(
    monkeypatch: pytest.MonkeyPatch,
    setup_db: None,
    s3_client,
    mock_instructor,
) -> None:
    label = LabelFactory()
    LabelImageFactory(
        label=label,
        status=UploadStatus.completed,
        file_path="labels/test-label/image_1.jpg",
    )

    monkeypatch.setattr(
        label_data_extraction.storage,
        "download_file",
        AsyncMock(return_value=b"fake-image"),
    )
    monkeypatch.setattr(
        label_data_extraction.extraction,
        "extract_fields_from_images",
        AsyncMock(
            side_effect=InstructorRetryException(
                "malformed json",
                n_attempts=1,
                total_usage=0,
            )
        ),
    )

    result = await label_data_extraction.extract_fertilizer_fields(
        s3_client=s3_client,
        label=label,
        instructor=mock_instructor,
        field_names=["brand_name", "product_name"],
    )

    assert result.brand_name is None
    assert result.product_name is None


@pytest.mark.asyncio
async def test_extract_subset_with_fallback_splits_and_recovers(
    monkeypatch: pytest.MonkeyPatch,
    mock_instructor,
) -> None:
    async def fake_extract(images, model, prompt, instructor_client):
        _ = (images, prompt, instructor_client)
        fields = list(model.model_fields.keys())
        if set(fields) == {"brand_name", "product_name"}:
            raise InstructorRetryException(
                "malformed json", n_attempts=1, total_usage=0
            )
        if fields == ["brand_name"]:
            return model.model_validate(
                {"brand_name": {"en": "Monty's", "fr": None}}
            ), None
        if fields == ["product_name"]:
            return model.model_validate(
                {"product_name": {"en": "Premium Growth", "fr": None}}
            ), None
        return model.model_validate({}), None

    monkeypatch.setattr(
        label_data_extraction.extraction,
        "extract_fields_from_images",
        fake_extract,
    )

    payload = await label_data_extraction._extract_subset_with_fallback(
        images=[label_data_extraction.extraction.ImageData(b"x", "image/jpeg")],
        field_names=["brand_name", "product_name"],
        instructor_client=mock_instructor,
    )

    assert payload["brand_name"]["en"] == "Monty's"
    assert payload["product_name"]["en"] == "Premium Growth"


@pytest.mark.asyncio
async def test_extract_subset_with_fallback_preemptively_splits_large_subset(
    monkeypatch: pytest.MonkeyPatch,
    mock_instructor,
) -> None:
    calls: list[list[str]] = []

    async def fake_extract(images, model, prompt, instructor_client):
        _ = (images, prompt, instructor_client)
        fields = list(model.model_fields.keys())
        calls.append(fields)
        data = {}
        if "brand_name" in fields:
            data["brand_name"] = {"en": "Monty's", "fr": None}
        if "product_name" in fields:
            data["product_name"] = {"en": "Premium Growth", "fr": None}
        if "lot_number" in fields:
            data["lot_number"] = "8452"
        if "net_weight" in fields:
            data["net_weight"] = "1.4 lbs"
        return model.model_validate(data), None

    monkeypatch.setattr(
        label_data_extraction.extraction,
        "extract_fields_from_images",
        fake_extract,
    )

    payload = await label_data_extraction._extract_subset_with_fallback(
        images=[label_data_extraction.extraction.ImageData(b"x", "image/jpeg")],
        field_names=["brand_name", "product_name", "lot_number", "net_weight"],
        instructor_client=mock_instructor,
    )

    assert payload["brand_name"]["en"] == "Monty's"
    assert payload["product_name"]["en"] == "Premium Growth"
    assert payload["lot_number"] == "8452"
    assert payload["net_weight"] == "1.4 lbs"
    assert all(len(batch) <= 3 for batch in calls)
