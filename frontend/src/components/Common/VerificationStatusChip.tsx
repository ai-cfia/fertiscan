import { Box, Chip } from "@mui/material"
import { useTranslation } from "react-i18next"
import type { VerificationStatus } from "@/api"

interface VerificationStatusChipProps {
  status: VerificationStatus | null
}

export default function VerificationStatusChip({
  status,
}: VerificationStatusChipProps) {
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
    VerificationStatus,
    "default" | "warning" | "success"
  > = {
    not_started: "default",
    in_progress: "warning",
    completed: "success",
  }
  const statusLabelMap: Record<VerificationStatus, string> = {
    not_started: t("filter.notStarted"),
    in_progress: t("filter.inProgress"),
    completed: t("filter.completed"),
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
