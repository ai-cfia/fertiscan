// ============================== Labels table empty ==============================

import LabelIcon from "@mui/icons-material/Label"
import SearchOffIcon from "@mui/icons-material/SearchOff"
import { useTranslation } from "react-i18next"
import EmptyState from "#/components/Common/EmptyState"

type LabelListEmptyStateProps = {
  hasActiveFilters: boolean
  colSpan: number
}

export default function LabelListEmptyState({
  hasActiveFilters,
  colSpan,
}: LabelListEmptyStateProps) {
  const { t } = useTranslation("labels")
  return hasActiveFilters ? (
    <EmptyState
      icon={SearchOffIcon}
      title={t("empty.noMatches")}
      description={t("empty.noMatchesDescription")}
      colSpan={colSpan}
    />
  ) : (
    <EmptyState
      icon={LabelIcon}
      title={t("empty.noLabels")}
      description={t("empty.noLabelsDescription")}
      colSpan={colSpan}
    />
  )
}
