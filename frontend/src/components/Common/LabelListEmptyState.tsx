import LabelIcon from "@mui/icons-material/Label"
import SearchOffIcon from "@mui/icons-material/SearchOff"
import { Box, TableCell, TableRow, Typography } from "@mui/material"
import { useTranslation } from "react-i18next"

interface LabelListEmptyStateProps {
  hasActiveFilters: boolean
  colSpan: number
}

export default function LabelListEmptyState({
  hasActiveFilters,
  colSpan,
}: LabelListEmptyStateProps) {
  const { t } = useTranslation("labels")
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          {hasActiveFilters ? (
            <>
              <SearchOffIcon sx={{ fontSize: 64, color: "text.secondary" }} />
              <Typography variant="h6" color="text.secondary">
                {t("empty.noMatches")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("empty.noMatchesDescription")}
              </Typography>
            </>
          ) : (
            <>
              <LabelIcon sx={{ fontSize: 64, color: "text.secondary" }} />
              <Typography variant="h6" color="text.secondary">
                {t("empty.noLabels")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("empty.noLabelsDescription")}
              </Typography>
            </>
          )}
        </Box>
      </TableCell>
    </TableRow>
  )
}
