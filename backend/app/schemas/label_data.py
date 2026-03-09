"""Label data API schemas."""

import re
from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_serializer,
    model_validator,
)

from app.db.models.enums import ProductClassification
from app.db.models.fertilizer_label_data_meta import FertilizerLabelDataFieldName
from app.db.models.label_data_field_meta import LabelDataFieldName
from app.schemas.type import RegistrationNumber

# ============================== Base/Shared Models ==============================


class Contact(BaseModel):
    type: str = Field(
        description="Type of contact",
        examples=["manufacturer", "distributor", "importer"],
    )
    name: str = Field(description="Company or organization name")
    address: str | None = Field(default=None, description="Full mailing address")
    phone: str | None = Field(default=None, description="Phone number in any format")
    email: EmailStr | None = Field(default=None, description="Email address")
    website: str | None = Field(default=None, description="Website URL")


class BilingualText(BaseModel):
    en: str | None = Field(
        default=None,
        description="The English text verbatim. Leave as null if not present.",
    )
    fr: str | None = Field(
        default=None,
        description="The French text verbatim. Leave as null if not present.",
    )


class Ingredient(BaseModel):
    name: BilingualText = Field(description="Ingredient name verbatim")
    value: str = Field(description="Ingredient percentage or amount.")
    unit: str = Field(
        description="Unit of measurement", examples=["%", "ppm", "mg/kg", "g/kg", "mm"]
    )
    registration_number: str | None = Field(
        default=None,
        description="Registration number of the product itself (not its individual ingredients).",
        examples=["1234567F"],
    )


class Nutrient(BaseModel):
    name: BilingualText = Field(
        description="Nutrient name verbatim",
        examples=[{"en": "Total Nitrogen (N)"}],
    )
    value: Decimal = Field(ge=0, description="Nutrient percentage value")
    unit: str = Field(
        description="Unit of measurement", examples=["%", "ppm", "mg/kg", "g/kg"]
    )


class GuaranteedAnalysis(BaseModel):
    title: BilingualText = Field(
        examples=[{"en": "Minimum Guaranteed Analysis"}],
    )
    is_minimum: bool = Field(
        description="True if title contains 'Minimum', false otherwise"
    )
    nutrients: list[Nutrient] = Field(
        description="List of nutrients with bilingual names, values and units"
    )


# ============================== LabelData Schemas =============================


class LabelData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    brand_name: BilingualText | None = None
    product_name: BilingualText | None = None
    contacts: list[Contact] | None = None
    registration_number: RegistrationNumber | None = None
    registration_claim: BilingualText | None = None
    lot_number: str | None = None
    net_weight: str | None = None
    volume: str | None = None
    exemption_claim: BilingualText | None = None
    country_of_origin: str | None = None


class LabelDataCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    brand_name: BilingualText | None = None
    product_name: BilingualText | None = None
    contacts: list[Contact] | None = None
    registration_number: RegistrationNumber | None = None
    registration_claim: BilingualText | None = None
    lot_number: str | None = None
    net_weight: str | None = None
    volume: str | None = None
    exemption_claim: BilingualText | None = None
    country_of_origin: str | None = None


class LabelDataUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    brand_name: BilingualText | None = None
    product_name: BilingualText | None = None
    contacts: list[Contact] | None = None
    registration_number: RegistrationNumber | None = None
    registration_claim: BilingualText | None = None
    lot_number: str | None = None
    net_weight: str | None = None
    volume: str | None = None
    exemption_claim: BilingualText | None = None
    country_of_origin: str | None = None


class LabelDataFieldMetaUpdate(BaseModel):
    field_name: LabelDataFieldName
    needs_review: bool | None = None
    note: str | None = None
    ai_generated: bool | None = None


class LabelDataFieldMetaResponse(BaseModel):
    field_name: str
    needs_review: bool
    note: str | None
    ai_generated: bool


# ======================== FertilizerLabelData Schemas ========================


class FertilizerLabelData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    n: Decimal | None = Field(default=None, ge=0)
    p: Decimal | None = Field(default=None, ge=0)
    k: Decimal | None = Field(default=None, ge=0)
    ingredients: list[Ingredient] | None = None
    guaranteed_analysis: GuaranteedAnalysis | None = None
    precaution_statements: list[BilingualText] | None = None
    directions_for_use_statements: list[BilingualText] | None = None
    customer_formula_statements: list[BilingualText] | None = None
    intended_use_statements: list[BilingualText] | None = None
    processing_instruction_statements: list[BilingualText] | None = None
    experimental_statements: list[BilingualText] | None = None
    export_statements: list[BilingualText] | None = None
    product_classification: ProductClassification | None = None

    @field_serializer("n", "p", "k", when_used="json")
    def serialize_decimal(self, value: Decimal | None) -> str | None:
        """Normalize Decimal to string, removing trailing zeros."""
        if value is None:
            return None
        return f"{value.normalize():f}"


class FertilizerLabelDataCreate(BaseModel):
    n: Decimal | None = Field(default=None, ge=0)
    p: Decimal | None = Field(default=None, ge=0)
    k: Decimal | None = Field(default=None, ge=0)
    ingredients: list[Ingredient] | None = None
    guaranteed_analysis: GuaranteedAnalysis | None = None
    precaution_statements: list[BilingualText] | None = None
    directions_for_use_statements: list[BilingualText] | None = None
    customer_formula_statements: list[BilingualText] | None = None
    intended_use_statements: list[BilingualText] | None = None
    processing_instruction_statements: list[BilingualText] | None = None
    experimental_statements: list[BilingualText] | None = None
    export_statements: list[BilingualText] | None = None
    product_classification: ProductClassification | None = None


class FertilizerLabelDataUpdate(BaseModel):
    n: Decimal | None = Field(default=None, ge=0)
    p: Decimal | None = Field(default=None, ge=0)
    k: Decimal | None = Field(default=None, ge=0)
    ingredients: list[Ingredient] | None = None
    guaranteed_analysis: GuaranteedAnalysis | None = None
    precaution_statements: list[BilingualText] | None = None
    directions_for_use_statements: list[BilingualText] | None = None
    customer_formula_statements: list[BilingualText] | None = None
    intended_use_statements: list[BilingualText] | None = None
    processing_instruction_statements: list[BilingualText] | None = None
    experimental_statements: list[BilingualText] | None = None
    export_statements: list[BilingualText] | None = None
    product_classification: ProductClassification | None = None


class FertilizerLabelDataMetaUpdate(BaseModel):
    field_name: FertilizerLabelDataFieldName
    needs_review: bool | None = None
    note: str | None = None
    ai_generated: bool | None = None


class FertilizerLabelDataMetaResponse(BaseModel):
    field_name: str
    needs_review: bool
    note: str | None
    ai_generated: bool


# ============================= Extraction Schemas =============================


class ExtractFieldsRequest(BaseModel):
    field_names: list[LabelDataFieldName | FertilizerLabelDataFieldName] | None = Field(
        default=None,
        description="List of field names to extract. If None or empty, extract all fields.",
    )


WEIGHT_SEGMENT_RE = re.compile(
    r"(?ix)\b\d+(?:[.,]\d+)?\s*(?:kg|g|mg|µg|ug|lb|lbs|oz)\b(?:\s*\([^)]*\))?"
)
VOLUME_SEGMENT_RE = re.compile(
    r"(?ix)\b\d+(?:[.,]\d+)?\s*(?:l|ml|µl|ul|liter(?:s)?|litre(?:s)?|usgal|gal(?:lon)?(?:s)?)\b(?:\s*\([^)]*\))?"
)


def _extract_first_segment(value: str | None, pattern: re.Pattern[str]) -> str | None:
    if not value:
        return None
    match = pattern.search(value)
    if not match:
        return None
    return match.group(0).strip(" -,:;/")


class ExtractFertilizerFieldsOutput(BaseModel):
    brand_name: BilingualText | None = Field(
        default=None,
        description="Brand name verbatim",
        examples=[{"en": "GreenGrow"}],
    )
    product_name: BilingualText | None = Field(
        default=None,
        description="Product name verbatim",
        examples=[{"en": "Premium All-Purpose Fertilizer"}],
    )
    contacts: list[Contact] | None = Field(
        default=None,
        description="List of contact information (manufacturer, distributor, etc.)",
    )

    registration_number: str | None = Field(
        default=None,
        max_length=8,
        min_length=8,
        description=(
            "Registration number as read on label (raw). "
            "Must be 7 digits + 1 letter; otherwise return '' or None. "
            "Keep verbatim if the format is correct."
        ),
        examples=["1234567F"],
    )

    registration_claim: BilingualText | None = Field(
        default=None,
        description="Verbatim: product registration claim text.",
    )
    lot_number: str | None = Field(default=None, description="Lot/batch number.")
    net_weight: str | None = Field(
        default=None,
        description=(
            "Net weight only, with weight units (g, kg, mg, µg, lb, oz). "
            "If a source line contains both weight and volume, keep only the weight part here."
        ),
        examples=["500 g"],
    )
    volume: str | None = Field(
        default=None,
        description=(
            "Volume only, with volume units (L, mL, µL, gal). "
            "If a source line contains both weight and volume, keep only the volume part here."
        ),
        examples=["500 mL"],
    )
    exemption_claim: BilingualText | None = Field(
        default=None,
        description="Verbatim: claim of registration exemption.",
    )
    country_of_origin: str | None = Field(
        default=None,
        description="Country: manufactured or imported from.",
    )
    product_classification: ProductClassification | None = Field(
        default=None,
        description="Classify: fertilizer (N/P/K plant food) | supplement | growing_medium | treated_seed.",
    )
    customer_formula_statements: list[BilingualText] | None = Field(
        default=None,
        description="Verbatim text: custom fertilizer prepared per purchaser specs, sold only to that buyer.",
    )
    intended_use_statements: list[BilingualText] | None = Field(
        default=None,
        description="Verbatim: intended use or target audience.",
    )
    processing_instruction_statements: list[BilingualText] | None = Field(
        default=None,
        description="Verbatim: requires further treatment beyond mixing/repackaging.",
    )
    experimental_statements: list[BilingualText] | None = Field(
        default=None,
        description="Verbatim: experimental/research use; destruction instructions if present.",
    )
    export_statements: list[BilingualText] | None = Field(
        default=None,
        description="Verbatim: product for export only, not for sale/use in Canada.",
    )
    n: Decimal | None = Field(
        default=None,
        ge=0,
        description="Nitrogen percentage (NPK analysis)",
        examples=["10.0"],
    )
    p: Decimal | None = Field(
        default=None,
        ge=0,
        description="Phosphorus percentage (NPK analysis)",
        examples=["5.0"],
    )
    k: Decimal | None = Field(
        default=None,
        ge=0,
        description="Potassium percentage (NPK analysis)",
        examples=["5.0"],
    )
    ingredients: list[Ingredient] | None = Field(
        default=None,
        description="Source materials/compounds (NOT guaranteed analysis).",
    )
    guaranteed_analysis: GuaranteedAnalysis | None = Field(
        default=None,
        description="Nutrient declaration section (NOT ingredient list).",
    )
    precaution_statements: list[BilingualText] | None = Field(
        default=None,
        description="Precaution statements verbatim.",
    )
    directions_for_use_statements: list[BilingualText] | None = Field(
        default=None,
        description="Directions for use verbatim.",
    )

    @model_validator(mode="after")
    def split_weight_and_volume(self) -> "ExtractFertilizerFieldsOutput":
        """Normalize mixed quantity strings into dedicated weight/volume fields."""
        # First, normalize each field if a mixed value was returned.
        weight_from_weight = _extract_first_segment(self.net_weight, WEIGHT_SEGMENT_RE)
        volume_from_weight = _extract_first_segment(self.net_weight, VOLUME_SEGMENT_RE)
        weight_from_volume = _extract_first_segment(self.volume, WEIGHT_SEGMENT_RE)
        volume_from_volume = _extract_first_segment(self.volume, VOLUME_SEGMENT_RE)

        # Keep the weight token in net_weight when present.
        if weight_from_weight:
            self.net_weight = weight_from_weight
        elif weight_from_volume and not self.net_weight:
            self.net_weight = weight_from_volume

        # Keep the volume token in volume when present.
        if volume_from_volume:
            self.volume = volume_from_volume
        elif volume_from_weight and not self.volume:
            self.volume = volume_from_weight

        return self
