// ============================== Field Name Mapping ==============================
const COMMON_FIELDS = [
  "brand_name",
  "product_name",
  "contacts",
  "registration_number",
  "registration_claim",
  "lot_number",
  "net_weight",
  "volume",
  "exemption_claim",
  "country_of_origin",
] as const
const FERTILIZER_FIELDS = [
  "n",
  "p",
  "k",
  "ingredients",
  "guaranteed_analysis",
  "precaution_statements",
  "directions_for_use_statements",
  "customer_formula_statements",
  "intended_use_statements",
  "processing_instruction_statements",
  "experimental_statements",
  "export_statements",
  "product_classification",
] as const
export type CommonFieldName = (typeof COMMON_FIELDS)[number]
export type FertilizerFieldName = (typeof FERTILIZER_FIELDS)[number]
export type LabelDataFieldName = CommonFieldName | FertilizerFieldName
export function isCommonField(fieldName: string): fieldName is CommonFieldName {
  return COMMON_FIELDS.includes(fieldName as CommonFieldName)
}
export function isFertilizerField(
  fieldName: string,
): fieldName is FertilizerFieldName {
  return FERTILIZER_FIELDS.includes(fieldName as FertilizerFieldName)
}
// ============================== Extraction Sections ==============================
export const EXTRACTION_SECTIONS = [
  {
    section: "basic",
    fieldNames: [
      "product_name",
      "brand_name",
      "contacts",
      "registration_number",
      "registration_claim",
      "lot_number",
      "net_weight",
      "volume",
      "exemption_claim",
      "country_of_origin",
      "product_classification",
    ],
  },
  { section: "npk", fieldNames: ["n", "p", "k"] },
  { section: "ingredients", fieldNames: ["ingredients"] },
  { section: "guaranteed", fieldNames: ["guaranteed_analysis"] },
  {
    section: "statements",
    fieldNames: [
      "precaution_statements",
      "directions_for_use_statements",
      "customer_formula_statements",
      "intended_use_statements",
      "processing_instruction_statements",
      "experimental_statements",
      "export_statements",
    ],
  },
] as const
