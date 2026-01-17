import CancelIcon from "@mui/icons-material/Cancel"
import CheckIcon from "@mui/icons-material/Check"
import { Chip } from "@mui/material"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { ReviewStatus } from "@/api"

interface LabelFilterChipsProps {
  reviewStatus?: ReviewStatus
  unlinked?: boolean
  onReviewStatusRemove: () => void
  onUnlinkedRemove: () => void
}

export default function LabelFilterChips({
  reviewStatus,
  unlinked,
  onReviewStatusRemove,
  onUnlinkedRemove,
}: LabelFilterChipsProps) {
  const { t } = useTranslation("labels")
  const activeFilters = useMemo(() => {
    const filters: Array<{
      key: string
      label: string
      onDelete: () => void
    }> = []
    const reviewStatusLabelMap: Record<ReviewStatus, string> = {
      not_started: t("filter.notStarted"),
      in_progress: t("filter.inProgress"),
      completed: t("filter.completed"),
    }
    if (reviewStatus) {
      filters.push({
        key: "review_status",
        label: `${t("filter.reviewStatus")}: ${reviewStatusLabelMap[reviewStatus]}`,
        onDelete: onReviewStatusRemove,
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
  }, [reviewStatus, unlinked, onReviewStatusRemove, onUnlinkedRemove, t])
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
