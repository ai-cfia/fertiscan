import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import LockIcon from "@mui/icons-material/Lock"
import LockOpenIcon from "@mui/icons-material/LockOpen"
import SaveIcon from "@mui/icons-material/Save"
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material"
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import { AxiosError } from "axios"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LabelsService } from "@/api"
import ImageCarousel from "@/components/Common/ImageCarousel"
import NotFound from "@/components/Common/NotFound"
import BasicInformationSection from "@/components/LabelData/BasicInformationSection"
import GuaranteedAnalysisSection from "@/components/LabelData/GuaranteedAnalysisSection"
import IngredientsSection from "@/components/LabelData/IngredientsSection"
import NPKAnalysisSection from "@/components/LabelData/NPKAnalysisSection"
import SafetyInformationSection from "@/components/LabelData/SafetyInformationSection"
import { useLabelDataEffects } from "@/hooks/useLabelDataEffects"
import { useLabelDataForm } from "@/hooks/useLabelDataForm"
import { useLabelDataMutations } from "@/hooks/useLabelDataMutations"
import { useLabelDataQueries } from "@/hooks/useLabelDataQueries"
import { useAppBarActionsStore } from "@/stores/useAppBarActions"
import { useLabelDataStore } from "@/stores/useLabelData"
import { getErrorMessage } from "@/utils/labelDataErrors"
import {
  getFieldMeta,
  isCommonFieldForReview,
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
      return { label }
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
  const [dismissed, setDismissed] = useState(false)
  const paginationRef = useRef<HTMLDivElement>(null)
  const isFertilizer = productType === "fertilizer"
  const {
    isExtracting: getIsExtracting,
    isFieldExtracting: getIsFieldExtracting,
  } = useLabelDataStore()
  const queries = useLabelDataQueries(labelId, isFertilizer)
  const {
    label,
    isLoadingLabel,
    labelData: _labelData,
    isLoadingData,
    isLabelDataError,
    labelDataError,
    fertilizerData: _fertilizerData,
    isLoadingFertilizerData,
    isFertilizerDataError,
    fertilizerDataError,
    labelDataMeta: _labelDataMeta,
    isLoadingMeta,
    isLabelDataMetaError,
    labelDataMetaError,
    fertilizerDataMeta: _fertilizerDataMeta,
    isLoadingFertilizerMeta,
    isFertilizerDataMetaError,
    fertilizerDataMetaError,
  } = queries
  const labelData = _labelData || {}
  const fertilizerData = _fertilizerData || {}
  const { form } = useLabelDataForm(labelData, fertilizerData)
  const labelDataMetaMap = useLabelDataMetaMap(
    _labelDataMeta,
    _fertilizerDataMeta,
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
  const mutations = useLabelDataMutations(
    labelId,
    isFertilizer,
    form,
    _labelDataMeta,
    _fertilizerDataMeta,
    hasImages,
  )
  const {
    createLabelDataMutation,
    createFertilizerDataMutation,
    updateReviewStatusMutation,
    extractFieldMutation,
    toggleReviewMutation,
    handleSave,
    isSaving,
  } = mutations
  const { loadError, setLoadError } = useLabelDataEffects(
    labelId,
    isFertilizer,
    isLoadingData,
    isLabelDataError,
    labelDataError,
    isLoadingFertilizerData,
    isFertilizerDataError,
    fertilizerDataError,
    isLabelDataMetaError,
    labelDataMetaError,
    isFertilizerDataMetaError,
    fertilizerDataMetaError,
    _labelData,
    _fertilizerData,
    createLabelDataMutation,
    createFertilizerDataMutation,
  )
  const isLoading =
    isLoadingLabel ||
    isLoadingData ||
    isLoadingMeta ||
    (isFertilizer && (isLoadingFertilizerData || isLoadingFertilizerMeta)) ||
    createLabelDataMutation.isPending ||
    createFertilizerDataMutation.isPending
  const isExtracting = getIsExtracting(labelId)
  const { getAccordionState, setAccordionExpanded } = useLabelDataStore()
  const { clearActions } = useAppBarActionsStore()
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
  const handleRetry = () => {
    setLoadError(null)
    setDismissed(false)
    queryClient.invalidateQueries({ queryKey: ["labelData", labelId] })
    queryClient.invalidateQueries({ queryKey: ["labelDataMeta", labelId] })
    if (isFertilizer) {
      queryClient.invalidateQueries({
        queryKey: ["fertilizerLabelData", labelId],
      })
      queryClient.invalidateQueries({
        queryKey: ["fertilizerLabelDataMeta", labelId],
      })
    }
  }
  const isDirty = form.formState.isDirty
  const isCompleted = label?.review_status === "completed"
  const handleSaveRef = useRef(handleSave)
  const extractFieldMutationRef = useRef(extractFieldMutation)
  const updateReviewStatusMutationRef = useRef(updateReviewStatusMutation)
  handleSaveRef.current = handleSave
  extractFieldMutationRef.current = extractFieldMutation
  updateReviewStatusMutationRef.current = updateReviewStatusMutation
  useEffect(() => {
    document.title = t("data.pageTitle")
  }, [t])
  useEffect(() => {
    return () => {
      clearActions()
    }
  }, [clearActions])
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  return (
    <Box sx={{ scrollPaddingTop: "120px", width: "100%" }}>
      {loadError && !dismissed && (
        <Alert
          severity="error"
          sx={{
            borderRadius: 0,
            borderBottom: 1,
            borderColor: "divider",
          }}
          action={
            <>
              <Button color="inherit" size="small" onClick={handleRetry}>
                {t("button.retry", { ns: "common" })}
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={() => setDismissed(true)}
              >
                {t("button.dismiss", { ns: "common" })}
              </Button>
            </>
          }
        >
          {getErrorMessage(loadError, t)}
        </Alert>
      )}
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
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() =>
                      updateReviewStatusMutationRef.current.mutate("completed")
                    }
                    disabled={updateReviewStatusMutationRef.current.isPending}
                    startIcon={<LockIcon />}
                    sx={{ mr: 0.5 }}
                  >
                    {t("data.markComplete")}
                  </Button>
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
