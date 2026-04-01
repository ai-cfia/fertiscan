// ============================== Edit label ==============================
// --- Label data form, images, extraction (API via server fns + session bearer) ---

import { zodResolver } from "@hookform/resolvers/zod"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import FactCheckIcon from "@mui/icons-material/FactCheck"
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
import {
  createFileRoute,
  Link,
  notFound,
  redirect,
  useBlocker,
} from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { StatusCodes } from "http-status-codes"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import ImageCarousel from "#/components/Common/ImageCarousel"
import NotFound from "#/components/Common/NotFound"
import BasicInformationSection from "#/components/LabelData/BasicInformationSection"
import GuaranteedAnalysisSection from "#/components/LabelData/GuaranteedAnalysisSection"
import IngredientsSection from "#/components/LabelData/IngredientsSection"
import NPKAnalysisSection from "#/components/LabelData/NPKAnalysisSection"
import ProductAssociationSection from "#/components/LabelData/ProductAssociationSection"
import StatementsAndClaimsSection from "#/components/LabelData/StatementsAndClaimsSection"
import { useSnackbar } from "#/components/SnackbarProvider"
import { useLabelDataQueries } from "#/hooks/useLabelDataQueries"
import {
  getLabelImageDataFn,
  readLabelForRouteFn,
  readLabelImagesFn,
} from "#/server/label-editor"
import { useAppBarActionsStore } from "#/stores/useAppBarActions"
import { useBanner } from "#/stores/useBanner"
import { useLabelDataStore } from "#/stores/useLabelData"
import { useLanguage } from "#/stores/useLanguage"
import {
  getErrorMessage,
  isAxiosErrorWithStatus,
} from "#/utils/labelDataErrors"
import {
  createLabelDataFormSchema,
  formPathToMetaFieldName,
  getDefaultFormValues,
  getFieldMeta,
  isCommonFieldForReview,
  useHasImages,
  useLabelDataMetaMap,
} from "#/utils/labelDataHelpers"

export const Route = createFileRoute(
  "/_layout/$productType/labels/$labelId/edit",
)({
  notFoundComponent: NotFound,
  loader: async ({ params }) => {
    const { labelId, productType } = params
    const r = await readLabelForRouteFn({
      data: { labelId, productType },
    })
    if (r.outcome === "not_found") {
      throw notFound()
    }
    if (r.outcome === "redirect") {
      throw redirect({
        to: "/$productType/labels/$labelId/edit",
        params: {
          productType: r.productType as "fertilizer",
          labelId: r.labelId,
        },
      })
    }
    return { label: r.label, isLinked: r.isLinked }
  },
  component: LabelData,
})

function LabelData() {
  const { t } = useTranslation(["labels", "errors", "common"])
  const labelDataFormSchema = useMemo(
    () =>
      createLabelDataFormSchema((k) =>
        (t as (key: string, opts?: { ns?: string }) => string)(k, {
          ns: "labels",
        }),
      ),
    [t],
  )
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
    defaultValues: getDefaultFormValues(),
    resolver: zodResolver(labelDataFormSchema) as any,
    mode: "onBlur",
  })
  const {
    label,
    labelData,
    labelDataMeta,
    fertilizerDataMeta,
    isLoading: isLoadingAll,
    isError: hasQueryError,
    error: queryError,
    updateReviewStatusMutation,
    extractFieldMutation,
    extractAllSectionsMutation,
    toggleReviewMutation,
    updateLabelMutation,
    createProductMutation,
    handleSave,
    isSaving,
  } = useLabelDataQueries(labelId, isFertilizer, form)
  const readLabelImages = useServerFn(readLabelImagesFn)
  const getLabelImagePresignedDownloadUrl = useServerFn(
    getLabelImageDataFn,
  )
  const { showSuccessToast } = useSnackbar()
  const { language } = useLanguage()
  const productName = form.watch("product_name") ?? labelData?.product_name
  const displayName =
    language === "fr"
      ? (productName?.fr ?? productName?.en ?? null)
      : (productName?.en ?? productName?.fr ?? null)
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
    const valid = await form.trigger("registration_number")
    if (!valid) return
    const values = form.getValues()
    try {
      const v = values as {
        registration_number?: string
        brand_name?: { en?: string; fr?: string }
        product_name?: { en?: string; fr?: string }
      }
      const product = await createProductMutation.mutateAsync({
        registration_number: v.registration_number,
        product_type: productType,
        brand_name_en: v.brand_name?.en ?? undefined,
        brand_name_fr: v.brand_name?.fr ?? undefined,
        name_en: v.product_name?.en ?? undefined,
        name_fr: v.product_name?.fr ?? undefined,
      })
      if (product) {
        await updateLabelMutation.mutateAsync(
          { product_id: product.id },
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
      // handled by mutation onError
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
        id: `label-edit-load-error-${labelId}`,
        message: getErrorMessage(error, t),
        severity: "error",
        onRetry: () => {
          queryClient.invalidateQueries({ queryKey: ["allLabelData", labelId] })
          dismissBanner(`label-edit-load-error-${labelId}`)
        },
        onDismiss: () => dismissBanner(`label-edit-load-error-${labelId}`),
      })
    } else {
      dismissBanner(`label-edit-load-error-${labelId}`)
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
    queryFn: async () => readLabelImages({ data: { labelId } }),
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
      queryFn: async () =>
        getLabelImagePresignedDownloadUrl({
          data: { labelId, imageId: image.id },
        }),
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
  const isLoading = isLoadingAll
  const isExtracting = getIsExtracting(labelId)
  const accordionState = getAccordionState(labelId)
  const getFieldMetaFn = (formPath: string) =>
    getFieldMeta(labelDataMetaMap, formPathToMetaFieldName(formPath))
  const handleExtractField = (fieldName: string | string[] | null) => {
    extractFieldMutation.mutate(fieldName)
  }
  const getIsFieldExtractingForSections = (formPath: string) =>
    getIsFieldExtracting(labelId, formPathToMetaFieldName(formPath))
  const handleToggleReview = (formPath: string) => {
    const metaFieldName = formPathToMetaFieldName(formPath)
    const currentMeta = getFieldMeta(labelDataMetaMap, metaFieldName)
    const newNeedsReview = !currentMeta.needs_review
    const isCommonField = isCommonFieldForReview(metaFieldName)
    toggleReviewMutation.mutate({
      fieldName: metaFieldName,
      newNeedsReview,
      isCommonField,
    })
  }
  const isDirty = form.formState.isDirty
  const isCompleted = label?.review_status === "completed"
  useBlocker({
    shouldBlockFn: () => {
      if (!isDirty) return false
      return !window.confirm(t("data.editUnsavedWarning", { ns: "labels" }))
    },
    enableBeforeUnload: isDirty,
  })
  const handleSaveRef = useRef(handleSave)
  const extractFieldMutationRef = useRef(extractFieldMutation)
  const extractAllSectionsMutationRef = useRef(extractAllSectionsMutation)
  const updateReviewStatusMutationRef = useRef(updateReviewStatusMutation)
  handleSaveRef.current = handleSave
  extractFieldMutationRef.current = extractFieldMutation
  extractAllSectionsMutationRef.current = extractAllSectionsMutation
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
          pt: 3,
          pb: { xs: 2, md: 3 },
          width: "100%",
        }}
      >
        <Box sx={{ py: 3 }}>
          <Typography variant="h4">
            {displayName
              ? `${t("data.title")} – ${displayName}`
              : t("data.title")}
          </Typography>
        </Box>
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
                  component={Link}
                  to={`/${productType}/labels/${labelId}/compliance`}
                  startIcon={<FactCheckIcon />}
                  sx={{ mr: 0.5 }}
                >
                  {t("data.compliance")}
                </Button>
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
                    onClick={() =>
                      extractAllSectionsMutationRef.current.mutate()
                    }
                    disabled={
                      isExtracting ||
                      isCompleted ||
                      extractAllSectionsMutation.isPending
                    }
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
                    brandNameEn={
                      (form.watch("brand_name") as { en?: string })?.en
                    }
                    brandNameFr={
                      (form.watch("brand_name") as { fr?: string })?.fr
                    }
                    productNameEn={
                      (form.watch("product_name") as { en?: string })?.en
                    }
                    productNameFr={
                      (form.watch("product_name") as { fr?: string })?.fr
                    }
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
                    getIsFieldExtracting={getIsFieldExtractingForSections}
                    onExtractField={handleExtractField}
                    onToggleReview={handleToggleReview}
                    isFertilizer={isFertilizer}
                    disabled={isCompleted}
                    fieldErrors={
                      form.formState.errors as Record<
                        string,
                        { message?: string } | undefined
                      >
                    }
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
                      getIsFieldExtracting={getIsFieldExtractingForSections}
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
                      getIsFieldExtracting={getIsFieldExtractingForSections}
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
                      getIsFieldExtracting={getIsFieldExtractingForSections}
                      onExtractField={handleExtractField}
                      onToggleReview={handleToggleReview}
                      disabled={isCompleted}
                    />
                  )}
                  {isFertilizer && (
                    <StatementsAndClaimsSection
                      control={form.control}
                      form={form}
                      accordionState={accordionState.statements}
                      onAccordionChange={(isExpanded) =>
                        setAccordionExpanded(labelId, "statements", isExpanded)
                      }
                      getFieldMeta={getFieldMetaFn}
                      hasImages={hasImages}
                      getIsFieldExtracting={getIsFieldExtractingForSections}
                      onExtractField={handleExtractField}
                      onToggleReview={handleToggleReview}
                      disabled={isCompleted}
                    />
                  )}
                </form>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
