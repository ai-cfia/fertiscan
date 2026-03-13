import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import LockIcon from "@mui/icons-material/Lock"
import LockOpenIcon from "@mui/icons-material/LockOpen"
import SaveIcon from "@mui/icons-material/Save"
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material"
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import { AxiosError } from "axios"
import { StatusCodes } from "http-status-codes"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LabelsService } from "@/api"
import ImageCarousel from "@/components/Common/ImageCarousel"
import NotFound from "@/components/Common/NotFound"
import BasicInformationSection from "@/components/LabelData/BasicInformationSection"
import GuaranteedAnalysisSection from "@/components/LabelData/GuaranteedAnalysisSection"
import IngredientsSection from "@/components/LabelData/IngredientsSection"
import NPKAnalysisSection from "@/components/LabelData/NPKAnalysisSection"
import ProductAssociationSection from "@/components/LabelData/ProductAssociationSection"
import SafetyInformationSection from "@/components/LabelData/SafetyInformationSection"
import { useSnackbar } from "@/components/SnackbarProvider"
import { useLabelDataQueries } from "@/hooks/useLabelDataQueries"
import { useAppBarActionsStore } from "@/stores/useAppBarActions"
import { useBanner } from "@/stores/useBanner"
import { useLabelDataStore } from "@/stores/useLabelData"
import {
  getErrorMessage,
  isAxiosErrorWithStatus,
} from "@/utils/labelDataErrors"
import {
  getFieldMeta,
  isCommonFieldForReview,
  transformBackendDataToFormValues,
  useHasImages,
  useLabelDataMetaMap,
} from "@/utils/labelDataHelpers"

export const Route = createFileRoute(
  "/_layout/$productType/labels/$labelId/review",
)({
  notFoundComponent: NotFound,
  loader: async ({ params }) => {
    const { labelId, productType } = params
    try {
      const response = await LabelsService.readLabel({
        path: { label_id: labelId },
      })
      const label = response.data
      if (!label) {
        throw notFound()
      }
      if (label.product_type.code !== productType) {
        throw redirect({
          to: "/$productType/labels/$labelId/review",
          params: {
            productType: label.product_type.code as "fertilizer",
            labelId: labelId,
          },
        })
      }
      const isLinked = !!label?.product_id
      return { label, isLinked }
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status
        const errorData = error.response?.data
        const isUuidParsingError =
          status === 422 &&
          Array.isArray(errorData?.detail) &&
          errorData.detail.some(
            (err: { type?: string }) => err.type === "uuid_parsing",
          )
        if (status === 404 || isUuidParsingError) {
          throw notFound()
        }
      }
      throw error
    }
  },
  component: LabelData,
})

function LabelData() {
  const { t } = useTranslation(["labels", "errors", "common"])
  const { labelId, productType } = Route.useParams()
  const queryClient = useQueryClient()
  const paginationRef = useRef<HTMLDivElement>(null)
  const isFertilizer = productType === "fertilizer"
  const {
    isExtracting: getIsExtracting,
    isFieldExtracting: getIsFieldExtracting,
    getAccordionState,
    setAccordionExpanded,
  } = useLabelDataStore()
  const { clearActions } = useAppBarActionsStore()
  const { showBanner, dismissBanner } = useBanner()
  const form = useForm({
    defaultValues: transformBackendDataToFormValues(undefined, undefined),
  })
  const {
    label,
    labelData,
    labelDataMeta,
    fertilizerDataMeta,
    isLoading: isLoadingAll,
    isError: hasQueryError,
    error: queryError,
    createLabelDataMutation,
    createFertilizerDataMutation,
    updateReviewStatusMutation,
    extractFieldMutation,
    toggleReviewMutation,
    updateLabelMutation,
    createProductMutation,
    handleSave,
    isSaving,
  } = useLabelDataQueries(labelId, isFertilizer, form)

  const { showSuccessToast } = useSnackbar()

  const handleAssociate = useCallback(
    (productId: string) => {
      updateLabelMutation.mutate(
        { product_id: productId },
        {
          onSuccess: () => {
            showSuccessToast(
              t("data.sections.association.linkSuccess", {
                ns: "labels",
                defaultValue: "Product associated successfully",
              }),
            )
          },
        },
      )
    },
    [updateLabelMutation, t, showSuccessToast],
  )

  const handleUnlink = useCallback(() => {
    updateLabelMutation.mutate(
      { product_id: null },
      {
        onSuccess: () => {
          showSuccessToast(
            t("data.sections.association.unlinkSuccess", {
              ns: "labels",
              defaultValue: "Product unlinked successfully",
            }),
          )
        },
      },
    )
  }, [updateLabelMutation, t, showSuccessToast])

  const handleCreateAndAssociate = useCallback(async () => {
    const values = form.getValues()
    try {
      const productResponse = await createProductMutation.mutateAsync({
        registration_number: values.registration_number,
        product_type: productType,
        brand_name_en: values.brand_name_en,
        brand_name_fr: values.brand_name_fr,
        name_en: values.product_name_en,
        name_fr: values.product_name_fr,
      })

      if (productResponse.data) {
        await updateLabelMutation.mutateAsync(
          { product_id: productResponse.data.id },
          {
            onSuccess: () => {
              showSuccessToast(
                t("data.sections.association.createAndLinkSuccess", {
                  ns: "labels",
                  defaultValue: "Product created and associated successfully",
                }),
              )
            },
          },
        )
      }
    } catch (_error) {
      // Errors are already handled by mutation global onError (showErrorToast)
    }
  }, [
    createProductMutation,
    updateLabelMutation,
    form,
    productType,
    t,
    showSuccessToast,
  ])

  const completionDisabledReason = useMemo(() => {
    if (!labelData) return t("data.validation.missingLabelData")
    if (!labelData.registration_number?.trim())
      return t("data.validation.missingRegistrationNumber")
    return null
  }, [labelData, t])

  const isReviewCompletable = !completionDisabledReason
  useEffect(() => {
    document.title = t("data.pageTitle")
  }, [t])
  useEffect(() => {
    return () => {
      clearActions()
    }
  }, [clearActions])
  useEffect(() => {
    if (
      hasQueryError &&
      !isAxiosErrorWithStatus(queryError, StatusCodes.NOT_FOUND)
    ) {
      const error = queryError as Error
      showBanner({
        id: `label-review-load-error-${labelId}`,
        message: getErrorMessage(error, t),
        severity: "error",
        onRetry: () => {
          queryClient.invalidateQueries({ queryKey: ["allLabelData", labelId] })
          dismissBanner(`label-review-load-error-${labelId}`)
        },
        onDismiss: () => dismissBanner(`label-review-load-error-${labelId}`),
      })
    } else {
      dismissBanner(`label-review-load-error-${labelId}`)
    }
  }, [
    hasQueryError,
    queryError,
    labelId,
    showBanner,
    dismissBanner,
    queryClient,
    t,
  ])
  const labelDataMetaMap = useLabelDataMetaMap(
    labelDataMeta,
    fertilizerDataMeta,
  )
  const hasImages = useHasImages(label)
  const { data: labelImages = [], isLoading: isLoadingImages } = useQuery({
    queryKey: ["labels", labelId, "images"],
    queryFn: async () => {
      const response = await LabelsService.readLabelImages({
        path: { label_id: labelId },
      })
      return response.data
    },
  })
  const completedImages = useMemo(
    () =>
      labelImages
        .filter((img) => img.status === "completed")
        .sort((a, b) => a.sequence_order - b.sequence_order),
    [labelImages],
  )
  const imageUrlQueries = useQueries({
    queries: completedImages.map((image) => ({
      queryKey: [
        "labels",
        labelId,
        "images",
        image.id,
        "presigned-download-url",
      ],
      queryFn: async () => {
        const response = await LabelsService.getLabelImagePresignedDownloadUrl({
          path: {
            label_id: labelId,
            image_id: image.id,
          },
        })
        if (!response.data) {
          throw new Error("Failed to get presigned URL")
        }
        return response.data.presigned_url
      },
      enabled: image.status === "completed",
    })),
  })
  const imageUrlList = useMemo(
    () =>
      imageUrlQueries
        .map((query) => query.data)
        .filter((url): url is string => url !== undefined),
    [imageUrlQueries],
  )
  const isLoadingImageUrls = imageUrlQueries.some((query) => query.isLoading)
  const isLoading =
    isLoadingAll ||
    createLabelDataMutation.isPending ||
    createFertilizerDataMutation.isPending
  const isExtracting = getIsExtracting(labelId)
  const accordionState = getAccordionState(labelId)
  const getFieldMetaFn = (fieldName: string) =>
    getFieldMeta(labelDataMetaMap, fieldName)
  const handleExtractField = (fieldName: string | string[] | null) => {
    extractFieldMutation.mutate(fieldName)
  }
  const getIsFieldExtractingWithAll = (fieldName: string) => {
    return isExtracting || getIsFieldExtracting(labelId, fieldName)
  }
  const handleToggleReview = (fieldName: string) => {
    const currentMeta = getFieldMetaFn(fieldName)
    const newNeedsReview = !currentMeta.needs_review
    const isCommonField = isCommonFieldForReview(fieldName)
    toggleReviewMutation.mutate({
      fieldName,
      newNeedsReview,
      isCommonField,
    })
  }
  const isDirty = form.formState.isDirty
  const isCompleted = label?.review_status === "completed"
  const handleSaveRef = useRef(handleSave)
  const extractFieldMutationRef = useRef(extractFieldMutation)
  const updateReviewStatusMutationRef = useRef(updateReviewStatusMutation)
  handleSaveRef.current = handleSave
  extractFieldMutationRef.current = extractFieldMutation
  updateReviewStatusMutationRef.current = updateReviewStatusMutation
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  return (
    <Box sx={{ scrollPaddingTop: "120px", width: "100%" }}>
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: 9,
          pb: { xs: 2, md: 3 },
          width: "100%",
        }}
      >
        <Typography variant="h4" sx={{ mb: 3 }}>
          {t("data.title")}
        </Typography>
        <Grid
          container
          spacing={3}
          sx={{ height: { md: "calc(100vh - 230px)" }, width: "100%" }}
        >
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{ height: { md: "100%" }, display: "flex" }}
          >
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: { xs: "400px", md: "100%" },
                overflow: "hidden",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Box sx={{ flex: 1, overflow: "hidden" }}>
                <ImageCarousel
                  images={imageUrlList.length > 0 ? imageUrlList : null}
                  isLoading={isLoadingImages || isLoadingImageUrls}
                  paginationEl={paginationRef.current}
                />
              </Box>
              <Toolbar
                sx={{
                  minHeight: "48px !important",
                  px: 1,
                  borderTop: 1,
                  borderColor: "divider",
                  "& .swiper-pagination": {
                    position: "static",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "auto",
                    transform: "none",
                  },
                }}
              >
                <div
                  ref={paginationRef}
                  style={{
                    display:
                      !isLoadingImages &&
                      !isLoadingImageUrls &&
                      imageUrlList.length > 0
                        ? "flex"
                        : "none",
                    flexGrow: 1,
                    justifyContent: "center",
                  }}
                />
              </Toolbar>
            </Paper>
          </Grid>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{ height: { md: "100%" }, display: "flex" }}
          >
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: { xs: "auto", md: "100%" },
                overflow: "hidden",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Toolbar
                sx={{
                  minHeight: "48px !important",
                  px: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  gap: 0.5,
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => handleSaveRef.current()}
                  disabled={!isDirty || isSaving}
                  startIcon={<SaveIcon />}
                  sx={{ mr: 0.5 }}
                >
                  {t("data.save")}
                </Button>
                {isFertilizer && (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => extractFieldMutationRef.current.mutate(null)}
                    disabled={isExtracting || isCompleted}
                    startIcon={<AutoAwesomeIcon />}
                    sx={{ mr: 0.5 }}
                  >
                    {t("data.extractAllFields")}
                  </Button>
                )}
                {label?.review_status === "completed" ? (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() =>
                      updateReviewStatusMutationRef.current.mutate(
                        "in_progress",
                      )
                    }
                    disabled={updateReviewStatusMutationRef.current.isPending}
                    startIcon={<LockOpenIcon />}
                    sx={{ mr: 0.5 }}
                  >
                    {t("data.continueReview")}
                  </Button>
                ) : (
                  <Tooltip title={completionDisabledReason ?? ""}>
                    <span>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() =>
                          updateReviewStatusMutationRef.current.mutate(
                            "completed",
                          )
                        }
                        disabled={
                          updateReviewStatusMutationRef.current.isPending ||
                          !isReviewCompletable
                        }
                        startIcon={<LockIcon />}
                        sx={{ mr: 0.5 }}
                      >
                        {t("data.markComplete")}
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </Toolbar>
              <Box
                sx={{
                  flex: 1,
                  overflow: "auto",
                  p: 2,
                }}
              >
                <form>
                  <ProductAssociationSection
                    label={label}
                    registrationNumber={form.watch("registration_number")}
                    brandNameEn={form.watch("brand_name_en")}
                    brandNameFr={form.watch("brand_name_fr")}
                    productNameEn={form.watch("product_name_en")}
                    productNameFr={form.watch("product_name_fr")}
                    accordionState={accordionState.association}
                    onAccordionChange={(isExpanded) =>
                      setAccordionExpanded(labelId, "association", isExpanded)
                    }
                    onAssociate={handleAssociate}
                    onCreateAndAssociate={handleCreateAndAssociate}
                    onUnlink={handleUnlink}
                    isLinking={updateLabelMutation.isPending}
                    isCreating={createProductMutation.isPending}
                    isUnlinking={updateLabelMutation.isPending}
                    disabled={isCompleted}
                  />
                  <BasicInformationSection
                    control={form.control}
                    accordionState={accordionState.basic}
                    onAccordionChange={(isExpanded) =>
                      setAccordionExpanded(labelId, "basic", isExpanded)
                    }
                    getFieldMeta={getFieldMetaFn}
                    hasImages={hasImages}
                    getIsFieldExtracting={getIsFieldExtractingWithAll}
                    onExtractField={handleExtractField}
                    onToggleReview={handleToggleReview}
                    disabled={isCompleted}
                  />
                  {isFertilizer && (
                    <NPKAnalysisSection
                      control={form.control}
                      accordionState={accordionState.npk}
                      onAccordionChange={(isExpanded) =>
                        setAccordionExpanded(labelId, "npk", isExpanded)
                      }
                      getFieldMeta={getFieldMetaFn}
                      hasImages={hasImages}
                      getIsFieldExtracting={getIsFieldExtractingWithAll}
                      onExtractField={handleExtractField}
                      onToggleReview={handleToggleReview}
                      disabled={isCompleted}
                    />
                  )}
                  {isFertilizer && (
                    <IngredientsSection
                      control={form.control}
                      form={form}
                      accordionState={accordionState.ingredients}
                      onAccordionChange={(isExpanded) =>
                        setAccordionExpanded(labelId, "ingredients", isExpanded)
                      }
                      getFieldMeta={getFieldMetaFn}
                      hasImages={hasImages}
                      getIsFieldExtracting={getIsFieldExtractingWithAll}
                      onExtractField={handleExtractField}
                      onToggleReview={handleToggleReview}
                      disabled={isCompleted}
                    />
                  )}
                  {isFertilizer && (
                    <GuaranteedAnalysisSection
                      control={form.control}
                      form={form}
                      accordionState={accordionState.guaranteed}
                      onAccordionChange={(isExpanded) =>
                        setAccordionExpanded(labelId, "guaranteed", isExpanded)
                      }
                      getFieldMeta={getFieldMetaFn}
                      hasImages={hasImages}
                      getIsFieldExtracting={getIsFieldExtractingWithAll}
                      onExtractField={handleExtractField}
                      onToggleReview={handleToggleReview}
                      disabled={isCompleted}
                    />
                  )}
                  <SafetyInformationSection
                    control={form.control}
                    accordionState={accordionState.safety}
                    onAccordionChange={(isExpanded) =>
                      setAccordionExpanded(labelId, "safety", isExpanded)
                    }
                    getFieldMeta={getFieldMetaFn}
                    hasImages={hasImages}
                    getIsFieldExtracting={getIsFieldExtractingWithAll}
                    onExtractField={handleExtractField}
                    onToggleReview={handleToggleReview}
                    isFertilizer={isFertilizer}
                    disabled={isCompleted}
                  />
                </form>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
