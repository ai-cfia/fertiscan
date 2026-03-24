"""Label data API schemas."""

from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_serializer,
)

from app.db.models.enums import ProductClassification
from app.db.models.fertilizer_label_data_meta import FertilizerLabelDataFieldName
from app.db.models.label_data_field_meta import LabelDataFieldName
from app.schemas.type import RegistrationNumber

# ============================== Base/Shared Models ==============================


class Contact(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
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
    model_config = ConfigDict(str_strip_whitespace=True)
    en: str | None = Field(
        default=None,
        description=(
            "The English text verbatim . Leave as null if not present."
            " Reject another language's text in this field."
        ),
    )
    fr: str | None = Field(
        default=None,
        description=(
            "The French text verbatim. Leave as null if not present."
            " Reject another language's text in this field."
        ),
    )


class Ingredient(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: BilingualText = Field(description="Ingredient name verbatim")
    value: str = Field(description="Ingredient percentage or amount.")
    unit: str = Field(
        description="Unit of measurement", examples=["%", "ppm", "mg/kg", "g/kg", "mm"]
    )
    registration_number: RegistrationNumber | None = Field(
        default=None,
        description="Per-ingredient or per-ingredient-group when the label assigns one number. Not the main product registration number.",
    )


class Nutrient(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: BilingualText = Field(
        description="Verbatim", examples=[{"en": "Total Nitrogen (N)"}]
    )
    value: Decimal | None = Field(default=None, ge=0, description="Verbatim")
    unit: str | None = Field(default=None, description="Verbatim")


class GuaranteedAnalysis(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: BilingualText = Field(
        description="Verbatim title of the guaranteed analysis section",
        examples=[{"en": "Minimum Guaranteed Analysis"}],
    )
    is_minimum: bool = Field(
        description="True when the title signals minimum guarantees; false otherwise"
    )
    nutrients: list[Nutrient] = Field(
        description="Nutrients listed verbatim in this guaranteed analysis block only",
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
    registration_number: RegistrationNumber | None = Field(
        default=None,
        description="Registration number of the product itself (main label), not ingredient registration numbers",
    )
    registration_claim: BilingualText | None = Field(
        default=None,
        description="Verbatim registration claim text",
    )
    lot_number: str | None = Field(
        default=None, description="Lot or batch number", examples=["LOT-2024-001"]
    )
    net_weight: str | None = Field(
        default=None,
        description="Verbatim mass only, reject volume",
    )

    volume: str | None = Field(
        default=None,
        description="Verbatim volume only, reject mass",
    )
    exemption_claim: BilingualText | None = Field(
        default=None,
        description="Verbatim claim of registration exemption (e.g., Section 18 mixture claims).",
        examples=[{"en": "All ingredients in this mixture are registered"}],
    )
    country_of_origin: str | None = Field(
        default=None,
        description="Country where the product was manufactured or from which it was imported.",
        examples=["Canada", "United States"],
    )
    product_classification: ProductClassification | None = Field(
        default=None,
        description=(
            "Classify the product. "
            "'fertilizer': contains N/P/K or plant food, sold as plant nutrient. "
            "'supplement': improves soil or aids growth, but is not a fertilizer. "
            "'growing_medium': a medium (e.g., potting mix) containing fertilizers/supplements. "
            "'treated_seed': seeds treated with fertilizers/supplements."
        ),
    )
    customer_formula_statements: list[BilingualText] | None = Field(
        default=None,
        description=(
            "A 'customer formula fertilizer' is a fertilizer prepared to the specifications of the purchaser "
            "and sold only to that purchaser. Extract verbatim text identifying the product as such, "
            "including the purchaser's name or any signature references."
        ),
    )
    intended_use_statements: list[BilingualText] | None = Field(
        default=None,
        description="Verbatim statements indicating intended use or target audience.",
        examples=[
            [
                {"en": "For industrial use only"},
                {"en": "Not for retail sale"},
            ]
        ],
    )
    processing_instruction_statements: list[BilingualText] | None = Field(
        default=None,
        description="Verbatim statements indicating the product requires further treatment, other than simple mixing or repackaging.",
        examples=[
            [
                {"en": "Requires further chemical processing"},
                {"en": "For use as an ingredient in XYZ manufacture"},
            ]
        ],
    )
    experimental_statements: list[BilingualText] | None = Field(
        default=None,
        description=(
            "Verbatim statements indicating the product is for experimental, research, or trial purposes, "
            "including instructions to destroy the product or plants upon completion."
        ),
        examples=[
            [
                {"en": "For experimental purposes only"},
                {"en": "Residual product and plants must be destroyed after trial"},
            ]
        ],
    )
    export_statements: list[BilingualText] | None = Field(
        default=None,
        description=(
            "Verbatim statements indicating that the product is not intended for sale or use in Canada "
            "and is intended for export only."
        ),
        examples=[
            [
                {"en": "For export only"},
                {"en": "Not for sale or use in Canada"},
            ]
        ],
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
        description="Verbatim; this is NOT the guaranteed analysis section",
    )
    guaranteed_analysis: GuaranteedAnalysis | None = Field(
        default=None,
        description="Verbatim; this is NOT the ingredient list",
    )
    precaution_statements: list[BilingualText] | None = Field(
        default=None,
        description="Precaution statements verbatim",
        examples=[[{"en": "Keep out of reach of children"}]],
    )
    directions_for_use_statements: list[BilingualText] | None = Field(
        default=None,
        description="Directions for use verbatim",
        examples=[[{"en": "Apply 2-3 cups per 100 square feet"}]],
    )
