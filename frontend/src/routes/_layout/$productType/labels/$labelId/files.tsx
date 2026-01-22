import {
  Box,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useParams } from "@tanstack/react-router"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LabelsService } from "@/api"
import LabelImageCard from "@/components/Common/LabelImageCard"
import { useConfig } from "@/stores/useConfig"

export const Route = createFileRoute(
  "/_layout/$productType/labels/$labelId/files",
)({
  component: LabelFiles,
})

function LabelFiles() {
  const { t } = useTranslation("labels")
  // ============================== Params ==============================
  const { labelId } = useParams({
    from: "/_layout/$productType/labels/$labelId/files",
  })
  // ============================== Store ==============================
  const { maxImagesPerLabel } = useConfig()
  // ============================== Data Fetching ==============================
  const { data: images = [], isLoading } = useQuery({
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
        <Typography variant="h4" sx={{ mb: 3 }}>
          {t("files.title", {
            count: sortedImages.length,
            max: maxImagesPerLabel,
          })}
        </Typography>
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
