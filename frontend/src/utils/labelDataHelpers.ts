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
