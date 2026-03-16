import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LabelsService } from "@/api"
import LabelImageCard from "@/components/Common/LabelImageCard"
import { useBanner } from "@/stores/useBanner"
import { useConfig } from "@/stores/useConfig"
import { getErrorMessage } from "@/utils/labelDataErrors"

export const Route = createFileRoute(
  "/_layout/$productType/labels/$labelId/files",
)({
  component: LabelFiles,
})

function LabelFiles() {
  const { t } = useTranslation(["labels", "errors"])
  const queryClient = useQueryClient()
  // ============================== Params ==============================
  const { labelId, productType } = useParams({
    from: "/_layout/$productType/labels/$labelId/files",
  })
  // ============================== Store ==============================
  const { maxImagesPerLabel } = useConfig()
  const { showBanner, dismissBanner } = useBanner()
  // ============================== Data Fetching ==============================
  const {
    data: images = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["labels", labelId, "images"],
    queryFn: async () => {
      const response = await LabelsService.readLabelImages({
        path: { label_id: labelId },
      })
      return response.data
    },
  })
  // ============================== Effects ==============================
  useEffect(() => {
    document.title = t("files.pageTitle")
  }, [t])
  useEffect(() => {
    if (isError && error) {
      showBanner({
        id: `label-files-load-error-${labelId}`,
        message: getErrorMessage(error, t),
        severity: "error",
        onRetry: () => {
          queryClient.invalidateQueries({
            queryKey: ["labels", labelId, "images"],
          })
          dismissBanner(`label-files-load-error-${labelId}`)
        },
        onDismiss: () => dismissBanner(`label-files-load-error-${labelId}`),
      })
    } else {
      dismissBanner(`label-files-load-error-${labelId}`)
    }
  }, [isError, error, labelId, showBanner, dismissBanner, queryClient, t])
  // ============================== Computed ==============================
  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.sequence_order - b.sequence_order),
    [images],
  )
  // ============================== Render ==============================
  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }
  return (
    <Container maxWidth="xl">
      <Box sx={{ pt: 3, pb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4">
            {t("files.title", {
              count: sortedImages.length,
              max: maxImagesPerLabel,
            })}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to={`/${productType}/labels/${labelId}/edit`}
          >
            {t("files.editLabel", { defaultValue: "Edit Label" })}
          </Button>
        </Box>
        {/* ============================== Label Images ============================== */}
        {sortedImages.length > 0 && (
          <Grid container spacing={2}>
            {sortedImages.map((image) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={image.id}>
                <LabelImageCard image={image} labelId={labelId} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  )
}
