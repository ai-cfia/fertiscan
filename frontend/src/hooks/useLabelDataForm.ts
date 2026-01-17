import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"

// ============================== Label Data Form ==============================
export function useLabelDataForm(labelData: any, fertilizerData: any) {
  const form = useForm({
    defaultValues: {
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
      guaranteed_analysis: fertilizerData?.guaranteed_analysis ?? {
        title_en: "",
        title_fr: "",
        is_minimum: false,
        nutrients: [],
      },
      caution_en: fertilizerData?.caution_en ?? "",
      caution_fr: fertilizerData?.caution_fr ?? "",
      instructions_en: fertilizerData?.instructions_en ?? "",
      instructions_fr: fertilizerData?.instructions_fr ?? "",
    },
  })
  const isResettingRef = useRef(false)
  useEffect(() => {
    if (labelData || fertilizerData) {
      isResettingRef.current = true
      form.reset({
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
        guaranteed_analysis: fertilizerData?.guaranteed_analysis ?? {
          title_en: "",
          title_fr: "",
          is_minimum: false,
          nutrients: [],
        },
        caution_en: fertilizerData?.caution_en ?? "",
        caution_fr: fertilizerData?.caution_fr ?? "",
        instructions_en: fertilizerData?.instructions_en ?? "",
        instructions_fr: fertilizerData?.instructions_fr ?? "",
      })
      setTimeout(() => {
        isResettingRef.current = false
      }, 100)
    }
  }, [labelData, fertilizerData, form])
  return { form, isResettingRef }
}
