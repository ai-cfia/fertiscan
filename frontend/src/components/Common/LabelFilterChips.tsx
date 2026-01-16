import CancelIcon from "@mui/icons-material/Cancel"
import CheckIcon from "@mui/icons-material/Check"
import { Chip } from "@mui/material"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { ExtractionStatus, VerificationStatus } from "@/api"

interface LabelFilterChipsProps {
  extractionStatus?: ExtractionStatus
  verificationStatus?: VerificationStatus
  unlinked?: boolean
  onExtractionStatusRemove: () => void
  onVerificationStatusRemove: () => void
  onUnlinkedRemove: () => void
}

export default function LabelFilterChips({
  extractionStatus,
  verificationStatus,
  unlinked,
  onExtractionStatusRemove,
  onVerificationStatusRemove,
  onUnlinkedRemove,
}: LabelFilterChipsProps) {
  const { t } = useTranslation("labels")
  const activeFilters = useMemo(() => {
    const filters: Array<{
      key: string
      label: string
      onDelete: () => void
    }> = []
    const extractionStatusLabelMap: Record<ExtractionStatus, string> = {
      pending: t("filter.pending"),
      in_progress: t("filter.inProgress"),
      completed: t("filter.completed"),
      failed: t("filter.failed"),
    }
    const verificationStatusLabelMap: Record<VerificationStatus, string> = {
      not_started: t("filter.notStarted"),
      in_progress: t("filter.inProgress"),
      completed: t("filter.completed"),
    }
    if (extractionStatus) {
      filters.push({
        key: "extraction_status",
        label: `${t("filter.extractionStatus")}: ${extractionStatusLabelMap[extractionStatus]}`,
        onDelete: onExtractionStatusRemove,
      })
    }
    if (verificationStatus) {
      filters.push({
        key: "verification_status",
        label: `${t("filter.verificationStatus")}: ${verificationStatusLabelMap[verificationStatus]}`,
        onDelete: onVerificationStatusRemove,
      })
    }
    if (unlinked === true) {
      filters.push({
        key: "unlinked",
        label: t("filter.unlinked"),
        onDelete: onUnlinkedRemove,
      })
    }
    return filters
  }, [
    extractionStatus,
    verificationStatus,
    unlinked,
    onExtractionStatusRemove,
    onVerificationStatusRemove,
    onUnlinkedRemove,
    t,
  ])
  if (activeFilters.length === 0) {
    return null
  }
  return (
    <>
      {activeFilters.map((filter) => (
        <Chip
          key={filter.key}
          label={filter.label}
          icon={<CheckIcon />}
          onDelete={filter.onDelete}
          deleteIcon={<CancelIcon />}
          variant="outlined"
          color="primary"
        />
      ))}
    </>
  )
}
