"""Tests for label data extraction service."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic import BaseModel

from app.controllers.labels.label_data_extraction import create_subset_model
from app.schemas.label_data import ExtractFertilizerFieldsOutput
from app.services.label_data_extraction import ImageData, extract_fields_from_images
from tests.conftest import DUMMY_EXTRACTION_DATA


@pytest.fixture
def sample_image_data() -> ImageData:
    """Sample image data for testing."""
    return ImageData(bytes=b"fake image bytes", content_type="image/jpeg")


@pytest.mark.asyncio
class TestExtractFieldsFromImages:
    """Tests for extract_fields_from_images function."""

    async def test_returns_all_fields(
        self, mock_instructor: MagicMock, sample_image_data: ImageData
    ) -> None:
        """Test that all fields are extracted and returned."""
        result = await extract_fields_from_images(
            [sample_image_data, sample_image_data],
            ExtractFertilizerFieldsOutput,
            "test prompt",
            mock_instructor,
        )
        assert isinstance(result, ExtractFertilizerFieldsOutput)
        assert result.brand_name_en == DUMMY_EXTRACTION_DATA["brand_name_en"]
        assert result.brand_name_en == "GreenGrow"
        assert result.brand_name_fr == "CroissanceVerte"
        assert result.product_name_en == "Premium All-Purpose Fertilizer"
        assert result.product_name_fr == "Engrais Polyvalent Premium"
        assert result.registration_number == "REG-2024-12345"
        assert result.lot_number == "LOT-2024-001"
        assert result.net_weight == "10 kg"
        assert result.n is not None
        assert result.p is not None
        assert result.k is not None
        assert result.contacts is not None
        assert len(result.contacts) == 2
        assert result.ingredients is not None
        assert result.guaranteed_analysis is not None

    async def test_works_with_empty_images(self, mock_instructor: MagicMock) -> None:
        """Test that function works with empty images list."""
        result = await extract_fields_from_images(
            [],
            ExtractFertilizerFieldsOutput,
            "test prompt",
            mock_instructor,
        )
        assert isinstance(result, ExtractFertilizerFieldsOutput)
        assert result.brand_name_en is None

    async def test_calls_instructor_with_correct_params(
        self, mock_instructor: MagicMock, sample_image_data: ImageData
    ) -> None:
        """Test that instructor is called with correct parameters."""
        await extract_fields_from_images(
            [sample_image_data],
            ExtractFertilizerFieldsOutput,
            "test prompt",
            mock_instructor,
        )
        mock_instructor.chat.completions.create_with_completion.assert_called_once()
        call_args = mock_instructor.chat.completions.create_with_completion.call_args
        assert call_args.kwargs["model"] is not None
        assert call_args.kwargs["response_model"] == ExtractFertilizerFieldsOutput
        messages = call_args.kwargs["messages"]
        assert len(messages) == 1
        assert messages[0]["role"] == "user"
        assert len(messages[0]["content"]) == 2
        assert messages[0]["content"][0]["type"] == "text"
        assert messages[0]["content"][0]["text"] == "test prompt"
        assert messages[0]["content"][1]["type"] == "image_url"

    async def test_works_with_different_model(
        self, mock_instructor: MagicMock, sample_image_data: ImageData
    ) -> None:
        """Test that function works with different Pydantic models."""

        class CustomModel(BaseModel):
            brand_name_en: str | None = None
            product_name_en: str | None = None

        mock_response = CustomModel.model_validate(DUMMY_EXTRACTION_DATA)
        mock_instructor.chat.completions.create_with_completion = AsyncMock(
            return_value=(mock_response, MagicMock())
        )
        result = await extract_fields_from_images(
            [sample_image_data], CustomModel, "test prompt", mock_instructor
        )
        assert isinstance(result, CustomModel)
        assert result.brand_name_en == "GreenGrow"
        assert result.product_name_en == "Premium All-Purpose Fertilizer"


@pytest.mark.asyncio
class TestExtractFieldsFromImagesWithFieldNames:
    """Tests for extract_fields_from_images with field_names parameter."""

    async def test_returns_single_field(
        self, mock_instructor: MagicMock, sample_image_data: ImageData
    ) -> None:
        """Test that single field is extracted and returned."""
        subset_model = create_subset_model(
            ExtractFertilizerFieldsOutput, ["brand_name_en"]
        )
        mock_response = subset_model.model_validate(DUMMY_EXTRACTION_DATA)
        mock_instructor.chat.completions.create_with_completion = AsyncMock(
            return_value=(mock_response, MagicMock())
        )
        result = await extract_fields_from_images(
            [sample_image_data],
            subset_model,
            "test prompt",
            mock_instructor,
        )
        assert isinstance(result, subset_model)
        assert result.brand_name_en == "GreenGrow"  # type: ignore[attr-defined]
        full_result = ExtractFertilizerFieldsOutput.model_validate(result.model_dump())
        assert full_result.brand_name_fr is None
        assert full_result.product_name_en is None

    async def test_returns_nested_field(
        self, mock_instructor: MagicMock, sample_image_data: ImageData
    ) -> None:
        """Test that nested fields like contacts are returned."""
        subset_model = create_subset_model(ExtractFertilizerFieldsOutput, ["contacts"])
        mock_response = subset_model.model_validate(DUMMY_EXTRACTION_DATA)
        mock_instructor.chat.completions.create_with_completion = AsyncMock(
            return_value=(mock_response, MagicMock())
        )
        result = await extract_fields_from_images(
            [sample_image_data],
            subset_model,
            "test prompt",
            mock_instructor,
        )
        assert isinstance(result, subset_model)
        assert result.contacts is not None  # type: ignore[attr-defined]
        assert len(result.contacts) == 2  # type: ignore[attr-defined]
        assert result.contacts[0].type == "manufacturer"  # type: ignore[attr-defined]
        assert result.contacts[0].name == "GreenGrow Industries Inc."  # type: ignore[attr-defined]
        full_result = ExtractFertilizerFieldsOutput.model_validate(result.model_dump())
        assert full_result.brand_name_en is None

    async def test_returns_npk_fields(
        self, mock_instructor: MagicMock, sample_image_data: ImageData
    ) -> None:
        """Test that NPK fields are returned correctly."""
        model_n = create_subset_model(ExtractFertilizerFieldsOutput, ["n"])
        model_p = create_subset_model(ExtractFertilizerFieldsOutput, ["p"])
        model_k = create_subset_model(ExtractFertilizerFieldsOutput, ["k"])
        mock_instructor.chat.completions.create_with_completion = AsyncMock(
            side_effect=[
                (model_n.model_validate(DUMMY_EXTRACTION_DATA), MagicMock()),
                (model_p.model_validate(DUMMY_EXTRACTION_DATA), MagicMock()),
                (model_k.model_validate(DUMMY_EXTRACTION_DATA), MagicMock()),
            ]
        )
        result_n = await extract_fields_from_images(
            [sample_image_data],
            model_n,
            "test prompt",
            mock_instructor,
        )
        result_p = await extract_fields_from_images(
            [sample_image_data],
            model_p,
            "test prompt",
            mock_instructor,
        )
        result_k = await extract_fields_from_images(
            [sample_image_data],
            model_k,
            "test prompt",
            mock_instructor,
        )
        assert result_n.n is not None  # type: ignore[attr-defined]
        assert result_p.p is not None  # type: ignore[attr-defined]
        assert result_k.k is not None  # type: ignore[attr-defined]

    async def test_raises_error_for_invalid_field(
        self, mock_instructor: MagicMock, sample_image_data: ImageData
    ) -> None:
        """Test that invalid field name raises ValueError."""
        with pytest.raises(ValueError, match="Fields not found"):
            create_subset_model(ExtractFertilizerFieldsOutput, ["invalid_field_name"])

    async def test_enforces_max_images_limit(
        self, mock_instructor: MagicMock, sample_image_data: ImageData
    ) -> None:
        """Test that function enforces maximum 10 images limit."""
        with pytest.raises(ValueError, match="Maximum 10 images"):
            await extract_fields_from_images(
                [sample_image_data] * 11,
                ExtractFertilizerFieldsOutput,
                "test prompt",
                mock_instructor,
            )

    async def test_works_with_empty_images_and_subset_model(
        self, mock_instructor: MagicMock
    ) -> None:
        """Test that function works with empty images list and subset model."""
        subset_model = create_subset_model(
            ExtractFertilizerFieldsOutput, ["brand_name_en"]
        )
        result = await extract_fields_from_images(
            [],
            subset_model,
            "test prompt",
            mock_instructor,
        )
        assert isinstance(result, subset_model)
        full_result = ExtractFertilizerFieldsOutput.model_validate(result.model_dump())
        assert full_result.brand_name_en is None

    async def test_returns_all_dummy_fields(
        self, mock_instructor: MagicMock, sample_image_data: ImageData
    ) -> None:
        """Test that all fields in DUMMY_EXTRACTION_DATA can be extracted."""
        fields_to_test = [
            "brand_name_en",
            "brand_name_fr",
            "product_name_en",
            "product_name_fr",
            "registration_number",
            "lot_number",
            "net_weight",
            "n",
            "p",
            "k",
            "ingredients",
            "guaranteed_analysis",
            "caution_en",
            "caution_fr",
            "instructions_en",
            "instructions_fr",
        ]
        for field_name in fields_to_test:
            subset_model = create_subset_model(
                ExtractFertilizerFieldsOutput, [field_name]
            )
            mock_response = subset_model.model_validate(DUMMY_EXTRACTION_DATA)
            mock_instructor.chat.completions.create_with_completion = AsyncMock(
                return_value=(mock_response, MagicMock())
            )
            result = await extract_fields_from_images(
                [sample_image_data],
                subset_model,
                "test prompt",
                mock_instructor,
            )
            assert isinstance(result, subset_model)
            field_value = getattr(result, field_name)
            assert field_value is not None, f"Field {field_name} should not be None"
