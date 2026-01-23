import { useMemo } from "react"

// ============================== Field Metadata Helpers ==============================
export function useLabelDataMetaMap(
  labelDataMeta: any[] | undefined,
  fertilizerDataMeta: any[] | undefined,
) {
  return useMemo(() => {
    const map = new Map<string, { needs_review: boolean }>()
    if (labelDataMeta) {
      for (const meta of labelDataMeta) {
        map.set(meta.field_name, {
          needs_review: meta.needs_review,
        })
      }
    }
    if (fertilizerDataMeta) {
      for (const meta of fertilizerDataMeta) {
        map.set(meta.field_name, {
          needs_review: meta.needs_review,
        })
      }
    }
    return map
  }, [labelDataMeta, fertilizerDataMeta])
}
export function getFieldMeta(
  labelDataMetaMap: Map<string, { needs_review: boolean }>,
  fieldName: string,
) {
  return (
    labelDataMetaMap.get(fieldName) ?? {
      needs_review: false,
    }
  )
}
export function useNeedsReviewCount(
  labelDataMeta: any[] | undefined,
  fertilizerDataMeta: any[] | undefined,
) {
  return useMemo(() => {
    let count = 0
    if (labelDataMeta) {
      count += labelDataMeta.filter((meta) => meta.needs_review).length
    }
    if (fertilizerDataMeta) {
      count += fertilizerDataMeta.filter((meta) => meta.needs_review).length
    }
    return count
  }, [labelDataMeta, fertilizerDataMeta])
}
export function useHasImages(label: any) {
  return useMemo(() => {
    return (
      label?.images?.some((img: any) => img.status === "completed") ?? false
    )
  }, [label])
}
export function isCommonFieldForReview(fieldName: string): boolean {
  return [
    "brand_name_en",
    "brand_name_fr",
    "product_name_en",
    "product_name_fr",
    "registration_number",
    "lot_number",
    "contacts",
    "net_weight",
    "volume",
  ].includes(fieldName)
}
// ============================== Form Value Transformation ==============================
export function transformGuaranteedAnalysis(val: any) {
  if (!val) {
    return {
      title_en: "",
      title_fr: "",
      is_minimum: false,
      nutrients: [],
    }
  }
  return {
    title_en: val.title_en ?? "",
    title_fr: val.title_fr ?? "",
    is_minimum: val.is_minimum ?? false,
    nutrients: (val.nutrients ?? []).map((nutrient: any) => ({
      name_en: nutrient.name_en ?? "",
      name_fr: nutrient.name_fr ?? "",
      value:
        nutrient.value !== undefined && nutrient.value !== null
          ? String(nutrient.value)
          : "",
      unit: nutrient.unit ?? "",
    })),
  }
}
export function transformBackendDataToFormValues(
  labelData: any,
  fertilizerData: any,
) {
  return {
    brand_name_en: labelData?.brand_name_en ?? "",
    brand_name_fr: labelData?.brand_name_fr ?? "",
    product_name_en: labelData?.product_name_en ?? "",
    product_name_fr: labelData?.product_name_fr ?? "",
    registration_number: labelData?.registration_number ?? "",
    lot_number: labelData?.lot_number ?? "",
    contacts: labelData?.contacts ?? [],
    net_weight: labelData?.net_weight ?? "",
    volume: labelData?.volume ?? "",
    n: fertilizerData?.n?.toString() ?? "",
    p: fertilizerData?.p?.toString() ?? "",
    k: fertilizerData?.k?.toString() ?? "",
    ingredients: fertilizerData?.ingredients ?? [],
    guaranteed_analysis: transformGuaranteedAnalysis(
      fertilizerData?.guaranteed_analysis,
    ),
    caution_en: fertilizerData?.caution_en ?? "",
    caution_fr: fertilizerData?.caution_fr ?? "",
    instructions_en: fertilizerData?.instructions_en ?? "",
    instructions_fr: fertilizerData?.instructions_fr ?? "",
  }
}
