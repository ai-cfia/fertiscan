import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { LabelsService, type ReviewStatus } from "@/api"
import { useSnackbar } from "@/components/SnackbarProvider"
import { useLabelDataStore } from "@/stores/useLabelData"
import { isCommonField, isFertilizerField } from "@/utils/labelData"
import { getErrorMessage } from "@/utils/labelDataErrors"

// ============================== Label Data Mutations ==============================
export function useLabelDataMutations(
  labelId: string,
  isFertilizer: boolean,
  form: any,
  labelDataMeta: any[] | undefined,
  fertilizerDataMeta: any[] | undefined,
  hasImages: boolean,
) {
  const { t } = useTranslation(["labels", "errors"])
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const { setExtracting, setFieldExtracting } = useLabelDataStore()
  const [isSaving, _setIsSaving] = useState(false)
  const createLabelDataMutation = useMutation({
    mutationFn: async () => {
      return await LabelsService.createLabelData({
        path: { label_id: labelId },
        body: {},
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labelData", labelId] })
      queryClient.invalidateQueries({ queryKey: ["labelDataMeta", labelId] })
    },
    onError: async (error) => {
      if (error instanceof AxiosError && error.response?.status === 409) {
        await queryClient.invalidateQueries({
          queryKey: ["labelData", labelId],
        })
        await queryClient.invalidateQueries({
          queryKey: ["labelDataMeta", labelId],
        })
      } else {
        throw error
      }
    },
  })
  const createFertilizerDataMutation = useMutation({
    mutationFn: async () => {
      return await LabelsService.createFertilizerLabelData({
        path: { label_id: labelId },
        body: {},
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fertilizerLabelData", labelId],
      })
      queryClient.invalidateQueries({
        queryKey: ["fertilizerLabelDataMeta", labelId],
      })
    },
    onError: async (error) => {
      if (error instanceof AxiosError && error.response?.status === 409) {
        await queryClient.invalidateQueries({
          queryKey: ["fertilizerLabelData", labelId],
        })
        await queryClient.invalidateQueries({
          queryKey: ["fertilizerLabelDataMeta", labelId],
        })
      } else {
        throw error
      }
    },
  })
  const updateReviewStatusMutation = useMutation({
    mutationFn: async (status: ReviewStatus) => {
      return await LabelsService.updateLabelReviewStatus({
        path: { label_id: labelId },
        body: { review_status: status },
      })
    },
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(["label", labelId], response.data)
      } else {
        queryClient.invalidateQueries({ queryKey: ["label", labelId] })
      }
    },
  })
  const processExtractedField = useCallback(
    (fieldName: string, value: any) => {
      const listOrObjectFields = [
        "contacts",
        "ingredients",
        "guaranteed_analysis",
      ]
      const isListOrObjectField = listOrObjectFields.includes(fieldName)
      const transformGuaranteedAnalysis = (val: any) => ({
        title_en: val?.title_en ?? "",
        title_fr: val?.title_fr ?? "",
        is_minimum: val?.is_minimum ?? false,
        nutrients: (val?.nutrients ?? []).map((nutrient: any) => ({
          name_en: nutrient.name_en ?? "",
          name_fr: nutrient.name_fr ?? "",
          value:
            nutrient.value !== undefined && nutrient.value !== null
              ? String(nutrient.value)
              : "",
          unit: nutrient.unit ?? "%",
        })),
      })
      let formValue: any
      if (value === undefined || value === null) {
        if (fieldName === "guaranteed_analysis") {
          formValue = {
            title_en: "",
            title_fr: "",
            is_minimum: false,
            nutrients: [],
          }
        } else if (isListOrObjectField) {
          formValue = []
        } else {
          formValue = ""
        }
      } else {
        if (fieldName === "guaranteed_analysis") {
          formValue = transformGuaranteedAnalysis(value)
        } else if (isListOrObjectField) {
          formValue = value
        } else {
          formValue = typeof value === "string" ? value : value.toString()
        }
      }
      form.setValue(fieldName as any, formValue, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
    },
    [form],
  )
  const extractFieldMutation = useMutation({
    mutationFn: async (fields: string | string[] | null) => {
      if (!isFertilizer) {
        throw new Error("Extraction is only available for fertilizer labels")
      }
      if (!hasImages) {
        throw new Error("No images available for extraction")
      }
      const fieldNames =
        fields === null ? null : Array.isArray(fields) ? fields : [fields]
      return await LabelsService.extractFertilizerFields({
        path: { label_id: labelId },
        body: fieldNames ? { field_names: fieldNames as any } : undefined,
      })
    },
    onMutate: (fields) => {
      if (fields === null) {
        setExtracting(labelId, true)
      } else {
        const fieldNames = Array.isArray(fields) ? fields : [fields]
        fieldNames.forEach((fieldName) => {
          setFieldExtracting(labelId, fieldName, true)
        })
      }
    },
    onSuccess: (response, fields) => {
      const extractedData = response.data
      if (!extractedData) {
        if (fields === null) {
          setExtracting(labelId, false)
        } else {
          const fieldNames = Array.isArray(fields) ? fields : [fields]
          fieldNames.forEach((fieldName) => {
            setFieldExtracting(labelId, fieldName, false)
          })
        }
        showErrorToast(t("data.extractionFailed", { ns: "labels" }))
        return
      }
      const fieldNames =
        fields === null
          ? Object.keys(extractedData)
          : Array.isArray(fields)
            ? fields
            : [fields]
      let populatedCount = 0
      fieldNames.forEach((fieldName) => {
        const value = (extractedData as any)?.[fieldName]
        if (value !== undefined && value !== null) {
          populatedCount++
        }
        processExtractedField(fieldName, value)
      })
      if (fields === null) {
        setExtracting(labelId, false)
      } else {
        const fieldNames = Array.isArray(fields) ? fields : [fields]
        fieldNames.forEach((fieldName) => {
          setFieldExtracting(labelId, fieldName, false)
        })
      }
      if (populatedCount > 0) {
        showSuccessToast(
          fieldNames.length > 1
            ? t("data.extractionAllSuccess", { ns: "labels" })
            : t("data.extractionSuccess", { ns: "labels" }),
        )
      } else {
        showErrorToast(t("data.extractionNoValue", { ns: "labels" }))
      }
    },
    onError: (error, fields) => {
      if (fields === null) {
        setExtracting(labelId, false)
      } else {
        const fieldNames = Array.isArray(fields) ? fields : [fields]
        fieldNames.forEach((fieldName) => {
          setFieldExtracting(labelId, fieldName, false)
        })
      }
      if (error instanceof Error) {
        if (
          error.message === "Extraction is only available for fertilizer labels"
        ) {
          showErrorToast(t("data.extractionOnlyFertilizer", { ns: "labels" }))
        } else if (error.message === "No images available for extraction") {
          showErrorToast(t("data.extractionNoImages", { ns: "labels" }))
        } else {
          showErrorToast(t("data.extractionFailed", { ns: "labels" }))
        }
      } else {
        showErrorToast(t("data.extractionFailed", { ns: "labels" }))
      }
    },
  })
  const toggleReviewMutation = useMutation({
    mutationFn: async ({
      fieldName,
      newNeedsReview,
      isCommonField,
    }: {
      fieldName: string
      newNeedsReview: boolean
      isCommonField: boolean
    }) => {
      if (isCommonField) {
        return await LabelsService.updateLabelDataMeta({
          path: { label_id: labelId },
          body: {
            field_name: fieldName as any,
            needs_review: newNeedsReview,
          },
        })
      }
      return await LabelsService.updateFertilizerLabelDataMeta({
        path: { label_id: labelId },
        body: {
          field_name: fieldName as any,
          needs_review: newNeedsReview,
        },
      })
    },
    onSuccess: (response, { fieldName, isCommonField }) => {
      const updatedMeta = response.data
      if (!updatedMeta) return
      const queryKey = isCommonField
        ? ["labelDataMeta", labelId]
        : ["fertilizerLabelDataMeta", labelId]
      const dataToUpdate = isCommonField ? labelDataMeta : fertilizerDataMeta
      queryClient.setQueryData(queryKey, (oldData: typeof dataToUpdate) => {
        if (!oldData) return [updatedMeta]
        const existingIndex = oldData.findIndex(
          (meta) => meta.field_name === fieldName,
        )
        if (existingIndex >= 0) {
          const newData = [...oldData]
          newData[existingIndex] = updatedMeta
          return newData
        }
        return [...oldData, updatedMeta]
      })
    },
  })
  const updateCommonDataMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await LabelsService.updateLabelData({
        path: { label_id: labelId },
        body: data,
      })
    },
  })
  const updateFertilizerDataMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await LabelsService.updateFertilizerLabelData({
        path: { label_id: labelId },
        body: data,
      })
    },
  })
  const handleSave = useCallback(async () => {
    if (!form.formState.isDirty) return
    const formValues = form.getValues()
    const dirtyFields = form.formState.dirtyFields
    const commonFields: Record<string, any> = {}
    const fertilizerFields: Record<string, any> = {}
    const trimmedFormValues: Record<string, any> = {}
    const listOrObjectFields = [
      "contacts",
      "ingredients",
      "guaranteed_analysis",
    ]
    const decimalFields = ["n", "p", "k"]
    Object.keys(formValues).forEach((fieldName) => {
      const value = formValues[fieldName as keyof typeof formValues]
      const isListOrObjectField = listOrObjectFields.includes(fieldName)
      const isDecimalField = decimalFields.includes(fieldName)
      let processedValue: any
      if (value === null || value === undefined) {
        processedValue = isListOrObjectField ? null : ""
      } else if (typeof value === "string") {
        const trimmed = value.trim()
        if (isDecimalField && trimmed === "") {
          processedValue = null
        } else {
          processedValue = trimmed
        }
      } else if (Array.isArray(value)) {
        processedValue = value
      } else if (typeof value === "object") {
        processedValue = value
      } else {
        processedValue = String(value).trim()
      }
      trimmedFormValues[fieldName] = processedValue
      if ((dirtyFields as Record<string, any>)[fieldName]) {
        if (isCommonField(fieldName)) {
          commonFields[fieldName] = processedValue
        } else if (isFertilizerField(fieldName)) {
          fertilizerFields[fieldName] = processedValue
        }
      }
    })
    try {
      const promises: Promise<any>[] = []
      if (Object.keys(commonFields).length > 0) {
        promises.push(updateCommonDataMutation.mutateAsync(commonFields))
      }
      if (Object.keys(fertilizerFields).length > 0) {
        promises.push(
          updateFertilizerDataMutation.mutateAsync(fertilizerFields),
        )
      }
      await Promise.all(promises)
      form.reset(trimmedFormValues, { keepDirty: false })
      showSuccessToast(t("data.saved", { ns: "labels" }))
    } catch (error) {
      const errorMessage = getErrorMessage(error, t)
      showErrorToast(errorMessage)
    }
  }, [
    form,
    updateCommonDataMutation,
    updateFertilizerDataMutation,
    t,
    showSuccessToast,
    showErrorToast,
  ])
  return {
    createLabelDataMutation,
    createFertilizerDataMutation,
    updateReviewStatusMutation,
    extractFieldMutation,
    toggleReviewMutation,
    updateCommonDataMutation,
    updateFertilizerDataMutation,
    handleSave,
    isSaving,
  }
}
