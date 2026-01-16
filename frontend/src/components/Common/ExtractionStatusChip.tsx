import { Box, Chip } from "@mui/material"
import { useTranslation } from "react-i18next"
import type { ExtractionStatus } from "@/api"

interface ExtractionStatusChipProps {
  status: ExtractionStatus | null
}

export default function ExtractionStatusChip({
  status,
}: ExtractionStatusChipProps) {
  const { t } = useTranslation("labels")
  if (!status) {
    return (
      <Box
        component="span"
        sx={{ color: "text.secondary", fontStyle: "italic" }}
      >
        —
      </Box>
    )
  }
  const colorMap: Record<
    ExtractionStatus,
    "default" | "warning" | "success" | "error"
  > = {
    pending: "default",
    in_progress: "warning",
    completed: "success",
    failed: "error",
  }
  const statusLabelMap: Record<ExtractionStatus, string> = {
    pending: t("filter.pending"),
    in_progress: t("filter.inProgress"),
    completed: t("filter.completed"),
    failed: t("filter.failed"),
  }
  return (
    <Chip
      label={statusLabelMap[status]}
      color={colorMap[status]}
      variant="filled"
      size="small"
    />
  )
}
