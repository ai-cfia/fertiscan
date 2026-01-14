import CancelIcon from "@mui/icons-material/Cancel"
import CheckIcon from "@mui/icons-material/Check"
import { Chip } from "@mui/material"
import { useMemo } from "react"
import type { ExtractionStatus, VerificationStatus } from "@/api"
import { formatStatusLabel } from "@/utils"

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
  const activeFilters = useMemo(() => {
    const filters: Array<{
      key: string
      label: string
      onDelete: () => void
    }> = []
    if (extractionStatus) {
      filters.push({
        key: "extraction_status",
        label: `Extraction Status: ${formatStatusLabel(extractionStatus)}`,
        onDelete: onExtractionStatusRemove,
      })
    }
    if (verificationStatus) {
      filters.push({
        key: "verification_status",
        label: `Verification Status: ${formatStatusLabel(verificationStatus)}`,
        onDelete: onVerificationStatusRemove,
      })
    }
    if (unlinked === true) {
      filters.push({
        key: "unlinked",
        label: "Unlinked",
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
