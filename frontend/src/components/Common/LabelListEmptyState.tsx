import LabelIcon from "@mui/icons-material/Label"
import SearchOffIcon from "@mui/icons-material/SearchOff"
import { Box, TableCell, TableRow, Typography } from "@mui/material"

interface LabelListEmptyStateProps {
  hasActiveFilters: boolean
  colSpan: number
}

export default function LabelListEmptyState({
  hasActiveFilters,
  colSpan,
}: LabelListEmptyStateProps) {
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
                No labels match your current filters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters to see more results.
              </Typography>
            </>
          ) : (
            <>
              <LabelIcon sx={{ fontSize: 64, color: "text.secondary" }} />
              <Typography variant="h6" color="text.secondary">
                No labels found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Labels you upload will appear here.
              </Typography>
            </>
          )}
        </Box>
      </TableCell>
    </TableRow>
  )
}
