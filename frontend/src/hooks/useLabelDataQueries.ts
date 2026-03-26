// ============================== Label data (client) ==============================
// --- Uses server fns: session bearer is httpOnly, browser cannot call OpenAPI client ---

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import pLimit from "p-limit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type {
  FertilizerLabelDataMetaResponse,
  LabelDataFieldMetaResponse,
  ReviewStatus,
} from "#/api/types.gen"
import { useSnackbar } from "#/components/SnackbarProvider"
import {
  createProductEditorFn,
  extractFertilizerFieldsFn,
  type FetchAllLabelDataResult,
  fetchAllLabelDataFn,
  toggleLabelFieldReviewFn,
  updateFertilizerLabelDataPartialFn,
  updateLabelDataPartialFn,
  updateLabelReviewStatusFn,
  updateLabelRootFn,
} from "#/server/label-editor"
import { useLabelDataStore } from "#/stores/useLabelData"
import {
  EXTRACTION_SECTIONS,
  isCommonField,
  isFertilizerField,
} from "#/utils/labelData"
import { getErrorMessage } from "#/utils/labelDataErrors"
import {
  mergeForForm,
  normalizeFieldValueForForm,
} from "#/utils/labelDataHelpers"

export function useLabelDataQueries(
  labelId: string,
  isFertilizer: boolean,
  form?: any,
) {
  const queryClient = useQueryClient()
  const fetchAllLabelData = useServerFn(fetchAllLabelDataFn)
  const updateReviewStatus = useServerFn(updateLabelReviewStatusFn)
  const extractFields = useServerFn(extractFertilizerFieldsFn)
  const toggleFieldReview = useServerFn(toggleLabelFieldReviewFn)
  const updateLabelDataPartial = useServerFn(updateLabelDataPartialFn)
  const updateFertilizerLabelDataPartial = useServerFn(
    updateFertilizerLabelDataPartialFn,
  )
  const updateLabelRoot = useServerFn(updateLabelRootFn)
  const createProduct = useServerFn(createProductEditorFn)
  const allLabelDataQuery = useQuery({
    queryKey: ["allLabelData", labelId, isFertilizer],
    queryFn: async () => {
      const result = (await fetchAllLabelData({
        data: { labelId, isFertilizer },
      })) as FetchAllLabelDataResult
      const out = {
        label: result.label,
        labelData: result.labelData || {},
        fertilizerData: result.fertilizerData || {},
        labelDataMeta: result.labelDataMeta || [],
        fertilizerDataMeta: result.fertilizerDataMeta || [],
      }
      if (form) {
        const formValues = mergeForForm(out.labelData, out.fertilizerData)
        form.reset(formValues, { keepDirty: false })
      }
      return out
    },
    retry: false,
    throwOnError: false,
  })
  const data = allLabelDataQuery.data
  const hasImages = useMemo(() => {
    return (
      data?.label?.images?.some(
        (img: { status?: string }) => img.status === "completed",
      ) ?? false
    )
  }, [data?.label])
  const { t } = useTranslation(["labels", "errors"])
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const { setExtracting, setFieldExtracting } = useLabelDataStore()
  const [isSaving, _setIsSaving] = useState(false)
  const updateReviewStatusMutation = useMutation({
    mutationFn: async (review_status: ReviewStatus) => {
      return await updateReviewStatus({
        data: { labelId, review_status },
      })
    },
    onSuccess: (updatedLabel) => {
      queryClient.setQueryData(["label", labelId], updatedLabel)
      queryClient.setQueryData(
        ["allLabelData", labelId, isFertilizer],
        (old: any) => {
          if (!old) return old
          return { ...old, label: updatedLabel }
        },
      )
    },
  })
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
      return await extractFields({
        data: { labelId, field_names: fieldNames },
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
    onSuccess: (extractedData, fields) => {
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
          ? Object.keys(extractedData as object)
          : Array.isArray(fields)
            ? fields
            : [fields]
      let populatedCount = 0
      fieldNames.forEach((fieldName) => {
        const value = (extractedData as Record<string, unknown>)?.[fieldName]
        if (value !== undefined && value !== null) {
          populatedCount++
        }
        processExtractedField(fieldName, value)
      })
      if (fields === null) {
        setExtracting(labelId, false)
      } else {
        const fns = Array.isArray(fields) ? fields : [fields]
        fns.forEach((fieldName) => {
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
  const EXTRACTION_CONCURRENCY_LIMIT = 1
  const extractAllSectionsMutation = useMutation({
    mutationFn: async () => {
      if (!isFertilizer) {
        throw new Error("Extraction is only available for fertilizer labels")
      }
      if (!hasImages) {
        throw new Error("No images available for extraction")
      }
      const limit = pLimit(EXTRACTION_CONCURRENCY_LIMIT)
      const promises = EXTRACTION_SECTIONS.map(({ fieldNames }) =>
        limit(() =>
          extractFields({
            data: { labelId, field_names: [...fieldNames] },
          })
            .then((extractedData) => {
              fieldNames.forEach((fieldName) => {
                setFieldExtracting(labelId, fieldName, false)
              })
              if (extractedData) {
                const ed = extractedData as Record<string, unknown>
                fieldNames.forEach((fieldName) => {
                  processExtractedField(fieldName, ed[fieldName])
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
        ),
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
    onMutate: () => {
      EXTRACTION_SECTIONS.forEach(({ fieldNames }) => {
        fieldNames.forEach((fieldName) => {
          setFieldExtracting(labelId, fieldName, true)
        })
      })
      setExtracting(labelId, true)
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
  const toggleReviewMutation = useMutation({
    mutationFn: async ({
      fieldName,
      newNeedsReview,
      isCommonField: common,
    }: {
      fieldName: string
      newNeedsReview: boolean
      isCommonField: boolean
    }) => {
      return await toggleFieldReview({
        data: {
          labelId,
          fieldName,
          newNeedsReview,
          isCommonField: common,
        },
      })
    },
    onSuccess: (updatedMeta, { fieldName, isCommonField: common }) => {
      const queryKey = common
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
          if (common) {
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
  const updateCommonDataMutation = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      return await updateLabelDataPartial({
        data: { labelId, patch },
      })
    },
    onSuccess: (labelData) => {
      queryClient.setQueryData(["labelData", labelId], labelData)
      queryClient.setQueryData(
        ["allLabelData", labelId, isFertilizer],
        (old: any) => {
          if (!old) return old
          return { ...old, labelData }
        },
      )
    },
  })
  const updateFertilizerDataMutation = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      return await updateFertilizerLabelDataPartial({
        data: { labelId, patch },
      })
    },
    onSuccess: (fertilizerData) => {
      queryClient.setQueryData(["fertilizerLabelData", labelId], fertilizerData)
      queryClient.setQueryData(
        ["allLabelData", labelId, isFertilizer],
        (old: any) => {
          if (!old) return old
          return { ...old, fertilizerData }
        },
      )
    },
  })
  const updateLabelMutation = useMutation({
    mutationFn: async (body: any) => {
      return await updateLabelRoot({ data: { labelId, patch: body } })
    },
    onSuccess: (updatedLabel) => {
      queryClient.setQueryData(["label", labelId], updatedLabel)
      queryClient.invalidateQueries({ queryKey: ["allLabelData", labelId] })
    },
    onError: (error) => {
      showErrorToast(getErrorMessage(error, t))
    },
  })
  const createProductMutation = useMutation({
    mutationFn: async (body: any) => {
      return await createProduct({ data: { body } })
    },
    onSuccess: () => {
      showSuccessToast(
        t("data.sections.association.createSuccess", {
          ns: "labels",
          defaultValue: "Product created successfully",
        }),
      )
    },
    onError: (error) => {
      showErrorToast(getErrorMessage(error, t))
    },
  })
  const handleSave = useCallback(async () => {
    if (!form || !form.formState.isDirty) return
    const valid = await form.trigger()
    if (!valid) return
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
  return {
    allLabelDataQuery,
    label: data?.label,
    labelData: data?.labelData || {},
    fertilizerData: data?.fertilizerData || {},
    labelDataMeta: data?.labelDataMeta || [],
    fertilizerDataMeta: data?.fertilizerDataMeta || [],
    isLoading: allLabelDataQuery.isLoading,
    isError: allLabelDataQuery.isError,
    error: allLabelDataQuery.error,
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
