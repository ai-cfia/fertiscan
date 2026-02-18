import { Box, TableCell, TableRow, Typography } from "@mui/material"
import type { OverridableComponent } from "@mui/material/OverridableComponent"
import type { SvgIconTypeMap } from "@mui/material/SvgIcon"

interface EmptyStateProps {
  icon: OverridableComponent<SvgIconTypeMap<object, "svg">>
  title: string
  description?: string
  colSpan: number
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  colSpan,
}: EmptyStateProps) {
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
          <Icon sx={{ fontSize: 64, color: "text.secondary" }} />
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      </TableCell>
    </TableRow>
  )
}
