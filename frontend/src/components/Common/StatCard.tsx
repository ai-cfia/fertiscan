import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Skeleton,
  Typography,
} from "@mui/material"

interface StatCardProps {
  label: string
  value: string | number
  supportingText?: string
  onViewAll?: () => void
  isLoading?: boolean
}

export default function StatCard({
  label,
  value,
  supportingText,
  onViewAll,
  isLoading = false,
}: StatCardProps) {
  return (
    <Card
      sx={{
        "&:hover": { elevation: 4 },
        transition: "all 0.2s ease-in-out",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardHeader
        title={label}
        subheader={supportingText}
        slotProps={{
          title: { variant: "h6" },
          subheader: { variant: "body2", color: "text.secondary" },
        }}
      />
      <CardContent sx={{ flexGrow: 1, py: 0 }}>
        <Box
          sx={{
            my: 0,
            minHeight: "3.5rem",
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          {isLoading ? (
            <Skeleton
              variant="text"
              width="60%"
              sx={{
                fontSize: (theme) => theme.typography.h3.fontSize,
                lineHeight: (theme) => theme.typography.h3.lineHeight,
              }}
            />
          ) : (
            <Typography variant="h3" component="div" sx={{ my: 0 }}>
              {value}
            </Typography>
          )}
        </Box>
      </CardContent>
      {onViewAll && (
        <CardActions sx={{ justifyContent: "flex-end", mt: "auto" }}>
          <Button
            variant="text"
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={(e) => {
              e.stopPropagation()
              onViewAll()
            }}
          >
            View All
          </Button>
        </CardActions>
      )}
    </Card>
  )
}
