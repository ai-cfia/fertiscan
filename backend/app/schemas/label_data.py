"""Label data API schemas."""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_serializer

from app.db.models.fertilizer_label_data_meta import FertilizerLabelDataFieldName
from app.db.models.label_data_field_meta import LabelDataFieldName

# ============================== Base/Shared Models
# ==============================


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


class Ingredient(BaseModel):
    name_en: str = Field(
        description="Ingredient name in English as it appears on the label"
    )
    name_fr: str | None = Field(
        default=None, description="Ingredient name in French as it appears on the label"
    )
    value: str = Field(description="Ingredient percentage or amount.")
    unit: str = Field(
        description="Unit of measurement", examples=["%", "ppm", "mg/kg", "g/kg", "mm"]
    )


class Nutrient(BaseModel):
    name_en: str = Field(
        description="Nutrient name in English as it appears on the label",
        examples=["Total Nitrogen (N)", "Available Phosphate (P₂O₅)"],
    )
    name_fr: str | None = Field(
        default=None,
        description="Nutrient name in French as it appears on the label",
        examples=["Azote Total (N)", "Phosphate Disponible (P₂O₅)"],
    )
    value: Decimal = Field(ge=0, description="Nutrient percentage value")
    unit: str = Field(
        description="Unit of measurement", examples=["%", "ppm", "mg/kg", "g/kg"]
    )


class GuaranteedAnalysis(BaseModel):
    title_en: str = Field(
        description="Section title in English from label",
        examples=["Minimum Guaranteed Analysis", "Guaranteed Analysis"],
    )
    title_fr: str | None = Field(
        default=None,
        description="Section title in French from label",
        examples=["Analyse Garantie Minimale", "Analyse Garantie"],
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
    brand_name_en: str | None = None
    brand_name_fr: str | None = None
    product_name_en: str | None = None
    product_name_fr: str | None = None
    contacts: list[Contact] | None = None
    registration_number: str | None = None
    lot_number: str | None = None
    net_weight: str | None = None
    volume: str | None = None


class LabelDataCreate(BaseModel):
    brand_name_en: str | None = None
    brand_name_fr: str | None = None
    product_name_en: str | None = None
    product_name_fr: str | None = None
    contacts: list[Contact] | None = None
    registration_number: str | None = None
    lot_number: str | None = None
    net_weight: str | None = None
    volume: str | None = None


class LabelDataUpdate(BaseModel):
    brand_name_en: str | None = None
    brand_name_fr: str | None = None
    product_name_en: str | None = None
    product_name_fr: str | None = None
    contacts: list[Contact] | None = None
    registration_number: str | None = None
    lot_number: str | None = None
    net_weight: str | None = None
    volume: str | None = None


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
    caution_en: str | None = None
    caution_fr: str | None = None
    instructions_en: str | None = None
    instructions_fr: str | None = None
    is_customer_formula: bool | None = None
    intended_use_statements: list[str] | None = None
    processing_instruction_statements: list[str] | None = None

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
    caution_en: str | None = None
    caution_fr: str | None = None
    instructions_en: str | None = None
    instructions_fr: str | None = None
    is_customer_formula: bool | None = None
    intended_use_statements: list[str] | None = None
    processing_instruction_statements: list[str] | None = None


class FertilizerLabelDataUpdate(BaseModel):
    n: Decimal | None = Field(default=None, ge=0)
    p: Decimal | None = Field(default=None, ge=0)
    k: Decimal | None = Field(default=None, ge=0)
    ingredients: list[Ingredient] | None = None
    guaranteed_analysis: GuaranteedAnalysis | None = None
    caution_en: str | None = None
    caution_fr: str | None = None
    instructions_en: str | None = None
    instructions_fr: str | None = None
    is_customer_formula: bool | None = None
    intended_use_statements: list[str] | None = None
    processing_instruction_statements: list[str] | None = None


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
    brand_name_en: str | None = Field(
        default=None, description="Brand name in English", examples=["GreenGrow"]
    )
    brand_name_fr: str | None = Field(
        default=None, description="Brand name in French", examples=["CroissanceVerte"]
    )
    product_name_en: str | None = Field(
        default=None,
        description="Product name in English",
        examples=["Premium All-Purpose Fertilizer"],
    )
    product_name_fr: str | None = Field(
        default=None,
        description="Product name in French",
        examples=["Engrais Polyvalent Premium"],
    )
    contacts: list[Contact] | None = Field(
        default=None,
        description="List of contact information (manufacturer, distributor, etc.)",
    )
    registration_number: str | None = Field(
        default=None,
        description="Product registration number",
        examples=["REG-2024-12345"],
    )
    lot_number: str | None = Field(
        default=None, description="Lot or batch number", examples=["LOT-2024-001"]
    )
    net_weight: str | None = Field(
        default=None, description="Net weight with unit", examples=["10 kg"]
    )
    volume: str | None = Field(
        default=None, description="Volume with unit", examples=["1 L"]
    )
    is_customer_formula: bool | None = Field(
        default=None,
        description=(
            "A 'customer formula fertilizer' is a fertilizer prepared to the specifications of the purchaser and sold only to that purchaser. True if the label indicates this, False if clearly retail, None if unclear."
        ),
    )
    intended_use_statements: list[str] | None = Field(
        default=None,
        description="Extract ALL raw statements on the label indicating intended use or target audience, not limited to the provided examples.",
        examples=[
            [
                "For industrial use only",
                "For manufacturing purposes",
                "Not for retail sale",
                "...",
            ]
        ],
    )
    processing_instruction_statements: list[str] | None = Field(
        default=None,
        description="Extract ALL raw statements indicating the product requires further treatment, other than simple mixing or repackaging, not limited to the provided examples.",
        examples=[
            [
                "Requires further chemical processing",
                "For use as an ingredient in XYZ manufacture",
                "...",
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
        description="Source materials or compounds the product is made from. This is NOT the guaranteed analysis section.",
    )
    guaranteed_analysis: GuaranteedAnalysis | None = Field(
        default=None,
        description="The guaranteed nutrient declaration section, usually under a header like 'Guaranteed Analysis' or 'Analyse Garantie'. This is NOT the ingredient list.",
    )
    caution_en: str | None = Field(
        default=None,
        description="Caution statements in English",
        examples=["Keep out of reach of children"],
    )
    caution_fr: str | None = Field(
        default=None,
        description="Caution statements in French",
        examples=["Tenir hors de la portée des enfants"],
    )
    instructions_en: str | None = Field(
        default=None,
        description="Usage instructions in English",
        examples=["Apply 2-3 cups per 100 square feet"],
    )
    instructions_fr: str | None = Field(
        default=None,
        description="Usage instructions in French",
        examples=["Appliquer 2-3 tasses par 100 pieds carrés"],
    )
