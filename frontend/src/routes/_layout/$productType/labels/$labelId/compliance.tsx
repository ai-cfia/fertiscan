import EditIcon from "@mui/icons-material/Edit"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Grid,
  ListSubheader,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import {
  createFileRoute,
  Link,
  notFound,
  redirect,
} from "@tanstack/react-router"
import { AxiosError } from "axios"
import { StatusCodes } from "http-status-codes"
import { useCallback, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LabelsService } from "@/api"
import NotFound from "@/components/Common/NotFound"
import BasicInformationSection from "@/components/LabelData/BasicInformationSection"
import GuaranteedAnalysisSection from "@/components/LabelData/GuaranteedAnalysisSection"
import IngredientsSection from "@/components/LabelData/IngredientsSection"
import NPKAnalysisSection from "@/components/LabelData/NPKAnalysisSection"
import ProductAssociationSection from "@/components/LabelData/ProductAssociationSection"
import StatementsAndClaimsSection from "@/components/LabelData/StatementsAndClaimsSection"
import { useComplianceDataQueries } from "@/hooks/useComplianceDataQueries"
import { useBanner } from "@/stores/useBanner"
import { useLabelDataStore } from "@/stores/useLabelData"
import { useLanguage } from "@/stores/useLanguage"
import {
  getErrorMessage,
  isAxiosErrorWithStatus,
} from "@/utils/labelDataErrors"
import { getDefaultFormValues, mergeForForm } from "@/utils/labelDataHelpers"

export const Route = createFileRoute(
  "/_layout/$productType/labels/$labelId/compliance",
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
          to: "/$productType/labels/$labelId/compliance",
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
  component: Compliance,
})

// ============================== Component ==============================
function Compliance() {
  const { t } = useTranslation(["labels", "errors"])
  const { labelId, productType } = Route.useParams()
  const { label } = Route.useLoaderData()
  const queryClient = useQueryClient()
  const { showBanner, dismissBanner } = useBanner()
  const { getAccordionState, setAccordionExpanded } = useLabelDataStore()
  const accordionState = getAccordionState(labelId)
  const {
    legislations,
    requirements,
    labelData,
    fertilizerData,
    meetsPrerequisite,
    isLoading,
    isError,
    error,
  } = useComplianceDataQueries(labelId, productType)
  const { language } = useLanguage()
  const requirementsByLegislation = useMemo(() => {
    return legislations
      .map((leg) => ({
        legislation: leg,
        requirements: requirements.filter((r) => r.legislation_id === leg.id),
      }))
      .filter((g) => g.requirements.length > 0)
  }, [legislations, requirements])
  const isFertilizer = productType === "fertilizer"
  const formValues = mergeForForm(labelData, fertilizerData)
  const form = useForm({
    defaultValues: getDefaultFormValues(),
    values: meetsPrerequisite ? formValues : undefined,
  })
  const noop = useCallback(() => {}, [])
  const getFieldMetaStub = useCallback(
    (_: string) => ({ needs_review: false }),
    [],
  )
  useEffect(() => {
    document.title = t("data.compliancePageTitle")
  }, [t])
  useEffect(() => {
    if (isError && !isAxiosErrorWithStatus(error, StatusCodes.NOT_FOUND)) {
      showBanner({
        id: `compliance-load-error-${labelId}`,
        message: getErrorMessage(error, t),
        severity: "error",
        onRetry: () => {
          queryClient.invalidateQueries({
            queryKey: ["legislations", productType],
          })
          queryClient.invalidateQueries({
            queryKey: ["requirements", productType],
          })
          queryClient.invalidateQueries({
            queryKey: ["complianceItems", labelId],
          })
          queryClient.invalidateQueries({ queryKey: ["labelData", labelId] })
          queryClient.invalidateQueries({
            queryKey: ["fertilizerLabelData", labelId],
          })
          dismissBanner(`compliance-load-error-${labelId}`)
        },
        onDismiss: () => dismissBanner(`compliance-load-error-${labelId}`),
      })
    } else {
      dismissBanner(`compliance-load-error-${labelId}`)
    }
  }, [
    isError,
    error,
    labelId,
    productType,
    showBanner,
    dismissBanner,
    queryClient,
    t,
  ])
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
        <Typography variant="h4" sx={{ py: 3 }}>
          {t("data.complianceTitle")}
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
                height: { xs: "auto", md: "100%" },
                overflow: "hidden",
                border: 1,
                borderColor: "divider",
              }}
            >
              {!meetsPrerequisite ? (
                <Box sx={{ p: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    {t("data.compliancePrerequisiteNotMet", {
                      defaultValue:
                        "Prerequisite not met: complete label data extraction first",
                    })}
                  </Typography>
                  <Button
                    component={Link}
                    to={`/${productType}/labels/${labelId}/review`}
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    sx={{ mt: 2 }}
                  >
                    {t("data.title")}
                  </Button>
                </Box>
              ) : (
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
                      brandNameEn={form.watch("brand_name")?.en}
                      brandNameFr={form.watch("brand_name")?.fr}
                      productNameEn={form.watch("product_name")?.en}
                      productNameFr={form.watch("product_name")?.fr}
                      accordionState={accordionState.association}
                      onAccordionChange={(isExpanded) =>
                        setAccordionExpanded(labelId, "association", isExpanded)
                      }
                      onAssociate={noop}
                      onCreateAndAssociate={noop}
                      disabled
                    />
                    <BasicInformationSection
                      control={form.control}
                      accordionState={accordionState.basic}
                      onAccordionChange={(isExpanded) =>
                        setAccordionExpanded(labelId, "basic", isExpanded)
                      }
                      getFieldMeta={getFieldMetaStub}
                      hasImages={false}
                      getIsFieldExtracting={() => false}
                      onExtractField={noop}
                      isFertilizer={isFertilizer}
                      disabled
                      readOnly
                    />
                    {isFertilizer && (
                      <NPKAnalysisSection
                        control={form.control}
                        accordionState={accordionState.npk}
                        onAccordionChange={(isExpanded) =>
                          setAccordionExpanded(labelId, "npk", isExpanded)
                        }
                        getFieldMeta={getFieldMetaStub}
                        hasImages={false}
                        getIsFieldExtracting={() => false}
                        onExtractField={noop}
                        disabled
                        readOnly
                      />
                    )}
                    {isFertilizer && (
                      <IngredientsSection
                        control={form.control}
                        form={form}
                        accordionState={accordionState.ingredients}
                        onAccordionChange={(isExpanded) =>
                          setAccordionExpanded(
                            labelId,
                            "ingredients",
                            isExpanded,
                          )
                        }
                        getFieldMeta={getFieldMetaStub}
                        hasImages={false}
                        getIsFieldExtracting={() => false}
                        onExtractField={noop}
                        disabled
                        readOnly
                      />
                    )}
                    {isFertilizer && (
                      <GuaranteedAnalysisSection
                        control={form.control}
                        form={form}
                        accordionState={accordionState.guaranteed}
                        onAccordionChange={(isExpanded) =>
                          setAccordionExpanded(
                            labelId,
                            "guaranteed",
                            isExpanded,
                          )
                        }
                        getFieldMeta={getFieldMetaStub}
                        hasImages={false}
                        getIsFieldExtracting={() => false}
                        onExtractField={noop}
                        disabled
                        readOnly
                      />
                    )}
                    {isFertilizer && (
                      <StatementsAndClaimsSection
                        control={form.control}
                        form={form}
                        accordionState={accordionState.statements}
                        onAccordionChange={(isExpanded) =>
                          setAccordionExpanded(
                            labelId,
                            "statements",
                            isExpanded,
                          )
                        }
                        getFieldMeta={getFieldMetaStub}
                        hasImages={false}
                        getIsFieldExtracting={() => false}
                        onExtractField={noop}
                        disabled
                        readOnly
                      />
                    )}
                  </form>
                </Box>
              )}
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
                  to={`/${productType}/labels/${labelId}/review`}
                  startIcon={<EditIcon />}
                >
                  {t("data.title")}
                </Button>
              </Toolbar>
              <Box sx={{ flex: 1, overflow: "auto", px: 2, pb: 2, pt: 0 }}>
                {requirementsByLegislation.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("data.complianceEvaluationPlaceholder", {
                      defaultValue:
                        "Requirement list and evaluation will appear here.",
                    })}
                  </Typography>
                ) : (
                  <Box>
                    {requirementsByLegislation.map(
                      ({ legislation, requirements: reqs }) => (
                        <Box key={legislation.id}>
                          <ListSubheader
                            component="div"
                            sx={{
                              position: "sticky",
                              top: 0,
                              zIndex: 1,
                              bgcolor: "background.paper",
                            }}
                          >
                            {language === "fr" && legislation.title_fr
                              ? legislation.title_fr
                              : (legislation.title_en ??
                                legislation.citation_reference)}
                          </ListSubheader>
                          {reqs.map((req) => {
                            const title =
                              language === "fr" && req.title_fr
                                ? req.title_fr
                                : (req.title_en ?? req.id)
                            return (
                              <Accordion
                                key={req.id}
                                disableGutters
                                sx={{
                                  "&:before": { display: "none" },
                                  boxShadow: "none",
                                  borderBottom: 1,
                                  borderColor: "divider",
                                }}
                              >
                                <AccordionSummary
                                  expandIcon={<ExpandMoreIcon />}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {title}
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontStyle: "italic" }}
                                  >
                                    {t(
                                      "data.complianceRequirementPlaceholder",
                                      {
                                        defaultValue:
                                          "Evaluation result will appear here.",
                                      },
                                    )}
                                  </Typography>
                                </AccordionDetails>
                              </Accordion>
                            )
                          })}
                        </Box>
                      ),
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
