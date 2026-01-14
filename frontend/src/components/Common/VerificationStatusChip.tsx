import { Box, Chip } from "@mui/material"
import type { VerificationStatus } from "@/api"
import { formatStatusLabel } from "@/utils"

interface VerificationStatusChipProps {
  status: VerificationStatus | null
}

export default function VerificationStatusChip({
  status,
}: VerificationStatusChipProps) {
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
    VerificationStatus,
    "default" | "warning" | "success"
  > = {
    not_started: "default",
    in_progress: "warning",
    completed: "success",
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
