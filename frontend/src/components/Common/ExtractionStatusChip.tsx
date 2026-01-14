import { Box, Chip } from "@mui/material"
import type { ExtractionStatus } from "@/api"
import { formatStatusLabel } from "@/utils"

interface ExtractionStatusChipProps {
  status: ExtractionStatus | null
}

export default function ExtractionStatusChip({
  status,
}: ExtractionStatusChipProps) {
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
  return (
    <Chip
      label={formatStatusLabel(status)}
      color={colorMap[status]}
      variant="filled"
      size="small"
    />
  )
}
