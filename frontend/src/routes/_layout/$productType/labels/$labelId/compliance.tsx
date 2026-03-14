import { Box, CircularProgress, Paper, Typography } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import { AxiosError } from "axios"
import { StatusCodes } from "http-status-codes"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { LabelsService } from "@/api"
import NotFound from "@/components/Common/NotFound"
import { useComplianceDataQueries } from "@/hooks/useComplianceDataQueries"
import { useBanner } from "@/stores/useBanner"
import {
  getErrorMessage,
  isAxiosErrorWithStatus,
} from "@/utils/labelDataErrors"

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
  Route.useLoaderData()
  const queryClient = useQueryClient()
  const { showBanner, dismissBanner } = useBanner()
  const {
    requirements,
    complianceItems,
    meetsPrerequisite,
    isLoading,
    isError,
    error,
  } = useComplianceDataQueries(labelId, productType)
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
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="body1" sx={{ mb: 1 }}>
            {t("data.complianceRequirementsCount", {
              count: requirements.length,
              defaultValue: "{{count}} requirements",
            })}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {t("data.complianceItemsCount", {
              count: complianceItems.length,
              defaultValue: "{{count}} compliance results",
            })}
          </Typography>
          <Typography variant="body1">
            {meetsPrerequisite
              ? t("data.compliancePrerequisiteMet", {
                  defaultValue:
                    "Prerequisite met: label data ready for evaluation",
                })
              : t("data.compliancePrerequisiteNotMet", {
                  defaultValue:
                    "Prerequisite not met: complete label data extraction first",
                })}
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}
