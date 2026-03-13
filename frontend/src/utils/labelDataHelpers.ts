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
export function formPathToMetaFieldName(path: string): string {
  const match = path.match(/^(.+?)\.(en|fr)$/)
  if (match) return match[1]
  return path
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
export function isCommonFieldForReview(metaFieldName: string): boolean {
  return [
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
  ].includes(metaFieldName)
}
// ============================== Minimal Form Helpers ==============================
function emptyBilingual(): { en: string; fr: string } {
  return { en: "", fr: "" }
}
function ensureBilingual(val: any): { en: string; fr: string } {
  if (!val || typeof val !== "object") return emptyBilingual()
  return {
    en: val.en ?? "",
    fr: val.fr ?? "",
  }
}
function ensureGuaranteedAnalysis(val: any): {
  title: { en: string; fr: string }
  is_minimum: boolean
  nutrients: Array<{
    name: { en: string; fr: string }
    value: string
    unit: string
  }>
} {
  if (!val || typeof val !== "object") {
    return {
      title: emptyBilingual(),
      is_minimum: false,
      nutrients: [],
    }
  }
  return {
    title: ensureBilingual(val.title),
    is_minimum: val.is_minimum ?? false,
    nutrients: (val.nutrients ?? []).map((n: any) => ({
      name: ensureBilingual(n?.name),
      value: n?.value != null ? String(n.value) : "",
      unit: n?.unit ?? "",
    })),
  }
}
function ensureIngredient(i: any): {
  name: { en: string; fr: string }
  value: string
  unit: string
  registration_number: string
} {
  if (!i || typeof i !== "object")
    return {
      name: emptyBilingual(),
      value: "",
      unit: "",
      registration_number: "",
    }
  return {
    name: ensureBilingual(i.name),
    value: i.value ?? "",
    unit: i.unit ?? "",
    registration_number: i.registration_number ?? "",
  }
}
function ensureStatementList(
  arr: any[] | null | undefined,
): Array<{ en: string; fr: string }> {
  if (!Array.isArray(arr)) return []
  return arr.map((x) => ensureBilingual(x))
}
export function getDefaultFormValues() {
  return {
    brand_name: emptyBilingual(),
    product_name: emptyBilingual(),
    contacts: [] as any[],
    registration_number: "",
    registration_claim: emptyBilingual(),
    lot_number: "",
    net_weight: "",
    volume: "",
    exemption_claim: emptyBilingual(),
    country_of_origin: "",
    n: "",
    p: "",
    k: "",
    ingredients: [] as any[],
    guaranteed_analysis: ensureGuaranteedAnalysis(null),
    precaution_statements: [] as Array<{ en: string; fr: string }>,
    directions_for_use_statements: [] as Array<{ en: string; fr: string }>,
    customer_formula_statements: [] as Array<{ en: string; fr: string }>,
    intended_use_statements: [] as Array<{ en: string; fr: string }>,
    processing_instruction_statements: [] as Array<{ en: string; fr: string }>,
    experimental_statements: [] as Array<{ en: string; fr: string }>,
    export_statements: [] as Array<{ en: string; fr: string }>,
    product_classification: null as string | null,
  }
}
export function mergeForForm(labelData: any, fertilizerData: any) {
  const ld = labelData ?? {}
  const fd = fertilizerData ?? {}
  return {
    brand_name: ensureBilingual(ld.brand_name),
    product_name: ensureBilingual(ld.product_name),
    contacts: ld.contacts ?? [],
    registration_number: ld.registration_number ?? "",
    registration_claim: ensureBilingual(ld.registration_claim),
    lot_number: ld.lot_number ?? "",
    net_weight: ld.net_weight ?? "",
    volume: ld.volume ?? "",
    exemption_claim: ensureBilingual(ld.exemption_claim),
    country_of_origin: ld.country_of_origin ?? "",
    n: fd.n != null ? String(fd.n) : "",
    p: fd.p != null ? String(fd.p) : "",
    k: fd.k != null ? String(fd.k) : "",
    ingredients: (fd.ingredients ?? []).map(ensureIngredient),
    guaranteed_analysis: ensureGuaranteedAnalysis(fd.guaranteed_analysis),
    precaution_statements: ensureStatementList(fd.precaution_statements),
    directions_for_use_statements: ensureStatementList(
      fd.directions_for_use_statements,
    ),
    customer_formula_statements: ensureStatementList(
      fd.customer_formula_statements,
    ),
    intended_use_statements: ensureStatementList(fd.intended_use_statements),
    processing_instruction_statements: ensureStatementList(
      fd.processing_instruction_statements,
    ),
    experimental_statements: ensureStatementList(fd.experimental_statements),
    export_statements: ensureStatementList(fd.export_statements),
    product_classification: fd.product_classification ?? null,
  }
}
export function normalizeFieldValueForForm(fieldName: string, value: any): any {
  if (value === undefined || value === null) {
    if (fieldName === "guaranteed_analysis")
      return ensureGuaranteedAnalysis(null)
    if (fieldName === "contacts") return []
    if (fieldName === "ingredients") return []
    const statementLists = [
      "precaution_statements",
      "directions_for_use_statements",
      "customer_formula_statements",
      "intended_use_statements",
      "processing_instruction_statements",
      "experimental_statements",
      "export_statements",
    ]
    if (statementLists.includes(fieldName)) return []
    if (["n", "p", "k"].includes(fieldName)) return ""
    if (fieldName === "product_classification") return null
    if (
      [
        "brand_name",
        "product_name",
        "registration_claim",
        "exemption_claim",
      ].includes(fieldName)
    )
      return emptyBilingual()
    return ""
  }
  if (fieldName === "guaranteed_analysis")
    return ensureGuaranteedAnalysis(value)
  if (fieldName === "contacts") return value
  if (fieldName === "ingredients") return (value ?? []).map(ensureIngredient)
  const statementLists = [
    "precaution_statements",
    "directions_for_use_statements",
    "customer_formula_statements",
    "intended_use_statements",
    "processing_instruction_statements",
    "experimental_statements",
    "export_statements",
  ]
  if (statementLists.includes(fieldName)) return ensureStatementList(value)
  if (
    [
      "brand_name",
      "product_name",
      "registration_claim",
      "exemption_claim",
    ].includes(fieldName)
  )
    return ensureBilingual(value)
  if (typeof value === "string") return value
  return value != null ? String(value) : ""
}
