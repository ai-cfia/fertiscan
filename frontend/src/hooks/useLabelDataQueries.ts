import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { StatusCodes } from "http-status-codes"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LabelsService, type ReviewStatus } from "@/api"
import { useSnackbar } from "@/components/SnackbarProvider"
import { useLabelDataStore } from "@/stores/useLabelData"
import { isCommonField, isFertilizerField } from "@/utils/labelData"
import {
  getErrorMessage,
  isAxiosErrorWithStatus,
} from "@/utils/labelDataErrors"
import {
  transformBackendDataToFormValues,
  transformGuaranteedAnalysis,
} from "@/utils/labelDataHelpers"

// ============================== Label Data Queries & Mutations ==============================
export function useLabelDataQueries(
  labelId: string,
  isFertilizer: boolean,
  form?: any,
  labelDataMeta?: any[],
  fertilizerDataMeta?: any[],
) {
  // --- Hooks & State ---
  const queryClient = useQueryClient()
  // --- Create Mutations (needed for query onError) ---
  // ............................. Create Label Data Mutation .............................
  const createLabelDataMutation = useMutation({
    mutationFn: async () => {
      return await LabelsService.createLabelData({
        path: { label_id: labelId },
        body: {},
      })
    },
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(["labelData", labelId], response.data)
        queryClient.invalidateQueries({ queryKey: ["allLabelData", labelId] })
      }
    },
    onError: async (error) => {
      if (isAxiosErrorWithStatus(error, StatusCodes.CONFLICT)) {
        await queryClient.invalidateQueries({
          queryKey: ["allLabelData", labelId],
        })
      } else {
        throw error
      }
    },
  })
  // ............................. Create Fertilizer Data Mutation .............................
  const createFertilizerDataMutation = useMutation({
    mutationFn: async () => {
      return await LabelsService.createFertilizerLabelData({
        path: { label_id: labelId },
        body: {},
      })
    },
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(
          ["fertilizerLabelData", labelId],
          response.data,
        )
        queryClient.invalidateQueries({ queryKey: ["allLabelData", labelId] })
      }
    },
    onError: async (error) => {
      if (isAxiosErrorWithStatus(error, StatusCodes.CONFLICT)) {
        await queryClient.invalidateQueries({
          queryKey: ["allLabelData", labelId],
        })
      } else {
        throw error
      }
    },
  })
  // --- Queries ---
  // ............................. Combined Label Data Query .............................
  const allLabelDataQuery = useQuery({
    queryKey: ["allLabelData", labelId, isFertilizer],
    queryFn: async () => {
      const labelPromise = LabelsService.readLabel({
        path: { label_id: labelId },
      }).then((r) => r.data)
      const labelDataMetaPromise = LabelsService.readLabelDataMeta({
        path: { label_id: labelId },
      }).then((r) => r.data)
      const labelDataPromise = LabelsService.readLabelData({
        path: { label_id: labelId },
      })
        .then((r) => r.data)
        .catch(async (error) => {
          if (isAxiosErrorWithStatus(error, StatusCodes.NOT_FOUND)) {
            await createLabelDataMutation.mutateAsync()
            const retry = await LabelsService.readLabelData({
              path: { label_id: labelId },
            })
            return retry.data
          }
          throw error
        })
      const promises: Promise<any>[] = [
        labelPromise,
        labelDataMetaPromise,
        labelDataPromise,
      ]
      if (isFertilizer) {
        const fertilizerDataPromise = LabelsService.readFertilizerLabelData({
          path: { label_id: labelId },
        })
          .then((r) => r.data)
          .catch(async (error) => {
            if (isAxiosErrorWithStatus(error, StatusCodes.NOT_FOUND)) {
              await createFertilizerDataMutation.mutateAsync()
              const retry = await LabelsService.readFertilizerLabelData({
                path: { label_id: labelId },
              })
              return retry.data
            }
            throw error
          })
        const fertilizerMetaPromise = LabelsService.readFertilizerLabelDataMeta(
          {
            path: { label_id: labelId },
          },
        ).then((r) => r.data)
        promises.push(fertilizerDataPromise, fertilizerMetaPromise)
      }
      const [label, labelDataMeta, labelData, ...rest] =
        await Promise.all(promises)
      const fertilizerData = isFertilizer ? rest[0] : undefined
      const fertilizerDataMeta = isFertilizer ? rest[1] : undefined
      const result = {
        label,
        labelData: labelData || {},
        fertilizerData: fertilizerData || {},
        labelDataMeta: labelDataMeta || [],
        fertilizerDataMeta: fertilizerDataMeta || [],
      }
      if (form) {
        const formValues = transformBackendDataToFormValues(
          result.labelData,
          result.fertilizerData,
        )
        form.reset(formValues, { keepDirty: false })
      }
      return result
    },
    retry: false,
    throwOnError: false,
  })
  // --- Computed Values ---
  const data = allLabelDataQuery.data
  const hasImages = useMemo(() => {
    return (
      data?.label?.images?.some((img: any) => img.status === "completed") ??
      false
    )
  }, [data?.label])
  // --- Mutations ---
  // ............................. Hooks & State .............................
  const { t } = useTranslation(["labels", "errors"])
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const { setExtracting, setFieldExtracting } = useLabelDataStore()
  const [isSaving, _setIsSaving] = useState(false)
  // --- Update Mutations ---
  // ............................. Update Review Status Mutation .............................
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
        queryClient.setQueryData(
          ["allLabelData", labelId, isFertilizer],
          (old: any) => {
            if (!old) return old
            return { ...old, label: response.data }
          },
        )
      }
    },
  })
  // --- Extract Mutation ---
  // ............................. Process Extracted Field Helper .............................
  const processExtractedField = useCallback(
    (fieldName: string, value: any) => {
      if (!form) return
      const listOrObjectFields = [
        "contacts",
        "ingredients",
        "guaranteed_analysis",
      ]
      const isListOrObjectField = listOrObjectFields.includes(fieldName)
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
  // ............................. Extract Field Mutation .............................
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
  // --- Toggle Review Mutation ---
  // ............................. Toggle Review Mutation .............................
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
      const updateMeta = (oldData: typeof dataToUpdate) => {
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
      }
      queryClient.setQueryData(queryKey, updateMeta)
      queryClient.setQueryData(
        ["allLabelData", labelId, isFertilizer],
        (old: any) => {
          if (!old) return old
          if (isCommonField) {
            return { ...old, labelDataMeta: updateMeta(old.labelDataMeta) }
          }
          return {
            ...old,
            fertilizerDataMeta: updateMeta(old.fertilizerDataMeta),
          }
        },
      )
    },
  })
  // --- Update Data Mutations ---
  // ............................. Update Common Data Mutation .............................
  const updateCommonDataMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await LabelsService.updateLabelData({
        path: { label_id: labelId },
        body: data,
      })
    },
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(["labelData", labelId], response.data)
        queryClient.setQueryData(
          ["allLabelData", labelId, isFertilizer],
          (old: any) => {
            if (!old) return old
            return { ...old, labelData: response.data }
          },
        )
      }
    },
  })
  // ............................. Update Fertilizer Data Mutation .............................
  const updateFertilizerDataMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await LabelsService.updateFertilizerLabelData({
        path: { label_id: labelId },
        body: data,
      })
    },
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(
          ["fertilizerLabelData", labelId],
          response.data,
        )
        queryClient.setQueryData(
          ["allLabelData", labelId, isFertilizer],
          (old: any) => {
            if (!old) return old
            return { ...old, fertilizerData: response.data }
          },
        )
      }
    },
  })
  // --- Save Handler ---
  // ............................. Handle Save .............................
  const handleSave = useCallback(async () => {
    if (!form || !form.formState.isDirty) return
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
  // --- Return ---
  return {
    // Combined Query
    allLabelDataQuery,
    // Data (for convenience)
    label: data?.label,
    labelData: data?.labelData || {},
    fertilizerData: data?.fertilizerData || {},
    labelDataMeta: data?.labelDataMeta || [],
    fertilizerDataMeta: data?.fertilizerDataMeta || [],
    isLoading: allLabelDataQuery.isLoading,
    isError: allLabelDataQuery.isError,
    error: allLabelDataQuery.error,
    // Mutations
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
