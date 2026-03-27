// ============================== Label files ==============================
// --- Label images grid; list + presigned URLs via server fns ---

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createFileRoute,
  Link,
  notFound,
  redirect,
} from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import LabelImageCard from "#/components/Common/LabelImageCard"
import NotFound from "#/components/Common/NotFound"
import { readLabelForRouteFn, readLabelImagesFn } from "#/server/label-editor"
import { useBanner } from "#/stores/useBanner"
import { useConfig } from "#/stores/useConfig"
import { getErrorMessage } from "#/utils/labelDataErrors"

export const Route = createFileRoute(
  "/_layout/$productType/labels/$labelId/files",
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
        to: "/$productType/labels/$labelId/files",
        params: {
          productType: r.productType as "fertilizer",
          labelId: r.labelId,
        },
      })
    }
    return { label: r.label }
  },
  component: LabelFiles,
})

function LabelFiles() {
  const { t } = useTranslation("labels")
  const { maxImagesPerLabel } = useConfig()
  const queryClient = useQueryClient()
  const { labelId, productType } = Route.useParams()
  const { showBanner, dismissBanner } = useBanner()
  const readLabelImages = useServerFn(readLabelImagesFn)
  const {
    data: images = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["labels", labelId, "images"],
    queryFn: async () => readLabelImages({ data: { labelId } }),
  })
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
  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.sequence_order - b.sequence_order),
    [images],
  )
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
            {sortedImages.length === 1
              ? t("files.title_one", {
                  count: sortedImages.length,
                  max: maxImagesPerLabel,
                  defaultValue: "Label Image: {{count}} (max {{max}})",
                })
              : t("files.title_other", {
                  count: sortedImages.length,
                  max: maxImagesPerLabel,
                  defaultValue: "Label Images: {{count}} (max {{max}})",
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
