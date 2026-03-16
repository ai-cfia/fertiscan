import { Box, CircularProgress, Grid, Typography } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import {
  createFileRoute,
  notFound,
  redirect,
  useBlocker,
} from "@tanstack/react-router"
import { AxiosError } from "axios"
import { StatusCodes } from "http-status-codes"
import { useCallback, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { ComplianceStatus } from "@/api"
import { LabelsService } from "@/api"
import NotFound from "@/components/Common/NotFound"
import ComplianceEvaluationPanel from "@/components/Compliance/ComplianceEvaluationPanel"
import ComplianceLabelDataPanel from "@/components/Compliance/ComplianceLabelDataPanel"
import { useComplianceDataQueries } from "@/hooks/useComplianceDataQueries"
import { useDeleteCompliance } from "@/hooks/useDeleteCompliance"
import { useEvaluateCompliance } from "@/hooks/useEvaluateCompliance"
import { useSaveCompliance } from "@/hooks/useSaveCompliance"
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
    complianceItems,
  } = useComplianceDataQueries(labelId, productType)
  const { language } = useLanguage()
  const requirementIds = useMemo(
    () => requirements.map((r) => r.id),
    [requirements],
  )
  const {
    evaluate,
    evaluateMany,
    cancelRequirement,
    isEvaluating,
    isEvaluatingAny,
    evaluationResults,
    getEvaluationError,
  } = useEvaluateCompliance(labelId, requirementIds)
  const { saveRequirement, isSaving: isSavingCompliance } = useSaveCompliance(
    labelId,
    complianceItems,
    language,
  )
  const { clearRequirement, isDeleting: isDeletingCompliance } =
    useDeleteCompliance(labelId, complianceItems)
  const complianceFormValues = useMemo(() => {
    const compliance: Record<
      string,
      { status: ComplianceStatus | ""; description: string }
    > = {}
    requirements.forEach((r) => {
      const fresh = evaluationResults[r.id]
      if (fresh) {
        const expl =
          language === "fr"
            ? (fresh.explanation?.fr ?? fresh.explanation?.en ?? "")
            : (fresh.explanation?.en ?? fresh.explanation?.fr ?? "")
        compliance[r.id] = { status: fresh.status, description: expl }
      } else {
        const item = complianceItems.find((i) => i.requirement_id === r.id)
        if (item?.status) {
          const expl =
            language === "fr"
              ? (item.description_fr ?? item.description_en ?? "")
              : (item.description_en ?? item.description_fr ?? "")
          compliance[r.id] = { status: item.status, description: expl }
        } else {
          compliance[r.id] = { status: "", description: "" }
        }
      }
    })
    return { compliance }
  }, [requirements, complianceItems, evaluationResults, language])
  const complianceFormDefaultValues = useMemo(
    () => ({
      compliance: Object.fromEntries(
        requirements.map((r) => [
          r.id,
          { status: "" as const, description: "" },
        ]),
      ),
    }),
    [requirements],
  )
  const complianceForm = useForm({
    defaultValues: complianceFormDefaultValues,
    values: complianceFormValues,
  })
  const { dirtyFields } = complianceForm.formState
  const getIsRequirementDirty = useCallback(
    (requirementId: string) => {
      const dirty = (dirtyFields.compliance ?? {}) as Record<
        string,
        { status?: boolean; description?: boolean }
      >
      const reqDirty = dirty[requirementId]
      if (reqDirty?.status || reqDirty?.description) return true
      const formVal = complianceForm.getValues().compliance?.[requirementId]
      if (!formVal || (!formVal.status && !formVal.description?.trim()))
        return false
      const item = complianceItems.find(
        (i) => i.requirement_id === requirementId,
      )
      if (!item) return true
      const savedDesc =
        language === "en"
          ? (item.description_en ?? "")
          : (item.description_fr ?? "")
      const savedStatus = item.status ?? ""
      return (
        formVal.status !== savedStatus ||
        (formVal.description ?? "") !== savedDesc
      )
    },
    [dirtyFields, complianceForm, complianceItems, language],
  )
  const handleSaveRequirement = useCallback(
    (requirementId: string) => {
      const values = complianceForm.getValues().compliance?.[requirementId]
      if (!values) return
      saveRequirement({
        requirementId,
        payload: {
          status: values.status || "",
          description: values.description || "",
        },
      })
    },
    [complianceForm, saveRequirement],
  )
  const hasUnsavedCompliance = requirements.some((r) =>
    getIsRequirementDirty(r.id),
  )
  useBlocker({
    shouldBlockFn: () => {
      if (!hasUnsavedCompliance) return false
      return !window.confirm(
        t("data.complianceUnsavedWarning", { ns: "labels" }),
      )
    },
    enableBeforeUnload: hasUnsavedCompliance,
  })
  const getHasRequirementData = useCallback(
    (requirementId: string) =>
      !!(
        evaluationResults[requirementId] ||
        complianceItems.some((i) => i.requirement_id === requirementId)
      ),
    [evaluationResults, complianceItems],
  )
  const getEvaluationErrorFormatted = useCallback(
    (requirementId: string) => {
      const err = getEvaluationError(requirementId)
      return err ? getErrorMessage(err, t) : null
    },
    [getEvaluationError, t],
  )
  const requirementsByLegislation = useMemo(() => {
    return legislations
      .map((leg) => ({
        legislation: leg,
        requirements: requirements.filter((r) => r.legislation_id === leg.id),
      }))
      .filter((g) => g.requirements.length > 0)
  }, [legislations, requirements])
  const formValues = mergeForForm(labelData, fertilizerData)
  const form = useForm({
    defaultValues: getDefaultFormValues(),
    values: meetsPrerequisite ? formValues : undefined,
  })
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
  const productName = meetsPrerequisite
    ? formValues.product_name
    : labelData?.product_name
  const displayName =
    language === "fr"
      ? (productName?.fr ?? productName?.en ?? null)
      : (productName?.en ?? productName?.fr ?? null)
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
              ? `${t("data.complianceTitle")} – ${displayName}`
              : t("data.complianceTitle")}
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
            <ComplianceLabelDataPanel
              label={label}
              labelId={labelId}
              productType={productType}
              meetsPrerequisite={meetsPrerequisite}
              form={form}
              accordionState={accordionState}
              onAccordionChange={(section, isExpanded) =>
                setAccordionExpanded(labelId, section, isExpanded)
              }
              isFertilizer={productType === "fertilizer"}
            />
          </Grid>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{ height: { md: "100%" }, display: "flex" }}
          >
            <ComplianceEvaluationPanel
              productType={productType}
              labelId={labelId}
              meetsPrerequisite={meetsPrerequisite}
              requirementsByLegislation={requirementsByLegislation}
              language={language}
              complianceControl={complianceForm.control}
              getIsRequirementDirty={getIsRequirementDirty}
              getHasRequirementData={getHasRequirementData}
              onSaveRequirement={handleSaveRequirement}
              onClearRequirement={clearRequirement}
              isSavingCompliance={isSavingCompliance}
              isDeletingCompliance={isDeletingCompliance}
              onEvaluate={evaluate}
              onEvaluateAll={() =>
                evaluateMany(
                  requirementsByLegislation.flatMap((g) =>
                    g.requirements.map((r) => r.id),
                  ),
                )
              }
              onEvaluateLegislation={(ids) => evaluateMany(ids)}
              onCancelRequirement={cancelRequirement}
              isEvaluating={isEvaluating}
              isEvaluatingAny={isEvaluatingAny}
              getEvaluationError={getEvaluationErrorFormatted}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
