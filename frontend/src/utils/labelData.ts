// ============================== Field Name Mapping ==============================
const COMMON_FIELDS = [
  "brand_name_en",
  "brand_name_fr",
  "product_name_en",
  "product_name_fr",
  "contacts",
  "registration_number",
  "lot_number",
  "net_weight",
  "volume",
] as const
const FERTILIZER_FIELDS = [
  "n",
  "p",
  "k",
  "ingredients",
  "guaranteed_analysis",
  "caution_en",
  "caution_fr",
  "instructions_en",
  "instructions_fr",
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
