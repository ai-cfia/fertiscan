import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from "@mui/material"
import { Link } from "@tanstack/react-router"

interface ActionCardProps {
  title: string
  description: string
  to: string
}

export default function ActionCard({
  title,
  description,
  to,
}: ActionCardProps) {
  return (
    <Card
      elevation={2}
      sx={{
        transition: "all 0.2s ease-in-out",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: (theme) => theme.shadows[4],
        },
      }}
    >
      <CardActionArea
        component={Link}
        to={to}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          right: 8,
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChevronRightIcon fontSize="small" color="primary" />
      </Box>
    </Card>
  )
}
