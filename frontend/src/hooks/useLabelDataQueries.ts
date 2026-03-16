import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { StatusCodes } from "http-status-codes"
import pLimit from "p-limit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type FertilizerLabelDataMetaResponse,
  type LabelDataFieldMetaResponse,
  LabelsService,
  ProductsService,
  type ReviewStatus,
} from "@/api"
import { useSnackbar } from "@/components/SnackbarProvider"
import { useLabelDataStore } from "@/stores/useLabelData"
import {
  EXTRACTION_SECTIONS,
  isCommonField,
  isFertilizerField,
} from "@/utils/labelData"
import {
  getErrorMessage,
  isAxiosErrorWithStatus,
} from "@/utils/labelDataErrors"
import {
  mergeForForm,
  normalizeFieldValueForForm,
} from "@/utils/labelDataHelpers"

// ============================== Label Data Queries & Mutations ==============================
export function useLabelDataQueries(
  labelId: string,
  isFertilizer: boolean,
  form?: any,
) {
  // --- Hooks & State ---
  const queryClient = useQueryClient()
  // ---- Create Mutations (needed for query onError) ----
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
        const formValues = mergeForForm(result.labelData, result.fertilizerData)
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
  const EXTRACTION_CONCURRENCY_LIMIT = 1
  // ............................. Process Extracted Field Helper .............................
  const processExtractedField = useCallback(
    (fieldName: string, value: any) => {
      if (!form) return
      const formValue = normalizeFieldValueForForm(fieldName, value)
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
  // ............................. Extract All Sections Mutation .............................
  const extractAllSectionsMutation = useMutation({
    mutationFn: async () => {
      if (!isFertilizer) {
        throw new Error("Extraction is only available for fertilizer labels")
      }
      if (!hasImages) {
        throw new Error("No images available for extraction")
      }
      const limit = pLimit(EXTRACTION_CONCURRENCY_LIMIT)
      EXTRACTION_SECTIONS.forEach(({ fieldNames }) => {
        fieldNames.forEach((fieldName) => {
          setFieldExtracting(labelId, fieldName, true)
        })
      })
      setExtracting(labelId, true)
      const promises = EXTRACTION_SECTIONS.map(({ fieldNames }) =>
        limit(() =>
          LabelsService.extractFertilizerFields({
            path: { label_id: labelId },
            body: { field_names: [...fieldNames] as any },
          }),
        )
          .then((response) => {
            fieldNames.forEach((fieldName) => {
              setFieldExtracting(labelId, fieldName, false)
            })
            if (response?.data) {
              const extractedData = response.data as Record<string, any>
              fieldNames.forEach((fieldName) => {
                processExtractedField(fieldName, extractedData[fieldName])
              })
              return true
            }
            return false
          })
          .catch(() => {
            fieldNames.forEach((fieldName) => {
              setFieldExtracting(labelId, fieldName, false)
            })
            return false
          }),
      )
      const results = await Promise.all(promises)
      const successSectionCount = results.filter(Boolean).length
      setExtracting(labelId, false)
      const totalSections = EXTRACTION_SECTIONS.length
      const failCount = totalSections - successSectionCount
      if (failCount === totalSections) {
        showErrorToast(t("data.extractionFailed", { ns: "labels" }))
      } else if (failCount > 0) {
        showSuccessToast(
          t("data.extractionPartialSuccess", {
            ns: "labels",
            defaultValue: "Extracted {{success}} of {{total}} sections",
            success: successSectionCount,
            total: totalSections,
          }),
        )
      } else {
        showSuccessToast(
          t("data.extractionComplete", {
            ns: "labels",
            defaultValue: "Extraction complete",
          }),
        )
      }
    },
    onError: (error) => {
      EXTRACTION_SECTIONS.forEach(({ fieldNames }) => {
        fieldNames.forEach((fieldName) => {
          setFieldExtracting(labelId, fieldName, false)
        })
      })
      setExtracting(labelId, false)
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
      type MetaItem =
        | LabelDataFieldMetaResponse
        | FertilizerLabelDataMetaResponse
      const updateMeta = (oldData: MetaItem[] | undefined): MetaItem[] => {
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
  // ............................. Update Label Mutation (Root) .............................
  const updateLabelMutation = useMutation({
    mutationFn: async (body: any) => {
      return await LabelsService.updateLabel({
        path: { label_id: labelId },
        body,
      })
    },
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(["label", labelId], response.data)
        queryClient.invalidateQueries({ queryKey: ["allLabelData", labelId] })
      }
    },
    onError: (error) => {
      showErrorToast(getErrorMessage(error, t))
    },
  })

  // ............................. Create Product Mutation .............................
  const createProductMutation = useMutation({
    mutationFn: async (body: any) => {
      return await ProductsService.createProduct({
        body,
      })
    },
    onSuccess: (response) => {
      if (response.data) {
        // We only show toast if it's a standalone creation,
        // usually this will be followed by a link action which has its own feedback.
        showSuccessToast(
          t("data.sections.association.createSuccess", {
            ns: "labels",
            defaultValue: "Product created successfully",
          }),
        )
      }
    },
    onError: (error) => {
      showErrorToast(getErrorMessage(error, t))
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
    const toPayload = (fieldName: string, value: any): any => {
      if (value === null || value === undefined) return value
      if (["n", "p", "k"].includes(fieldName)) {
        const s = typeof value === "string" ? value.trim() : String(value)
        return s === "" ? null : value
      }
      if (typeof value === "string") return value.trim()
      return value
    }
    Object.keys(formValues).forEach((fieldName) => {
      if (!(dirtyFields as Record<string, any>)[fieldName]) return
      if (isCommonField(fieldName)) {
        commonFields[fieldName] = toPayload(
          fieldName,
          formValues[fieldName as keyof typeof formValues],
        )
      } else if (isFertilizerField(fieldName)) {
        fertilizerFields[fieldName] = toPayload(
          fieldName,
          formValues[fieldName as keyof typeof formValues],
        )
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
      form.reset(form.getValues(), { keepDirty: false })
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
    extractAllSectionsMutation,
    toggleReviewMutation,
    updateCommonDataMutation,
    updateFertilizerDataMutation,
    updateLabelMutation,
    createProductMutation,
    handleSave,
    isSaving,
  }
}
