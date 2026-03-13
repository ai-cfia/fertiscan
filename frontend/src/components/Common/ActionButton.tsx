import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import { Button, Typography } from "@mui/material"
import { Link } from "@tanstack/react-router"

interface ActionButtonProps {
  title: string
  description: string
  to: string
  variant?: "text" | "outlined" | "contained"
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning"
}

export default function ActionButton({
  title,
  description,
  to,
  variant = "contained",
  color = "primary",
}: ActionButtonProps) {
  return (
    <Button
      component={Link}
      to={to}
      variant={variant}
      color={color}
      fullWidth
      endIcon={<ChevronRightIcon />}
      sx={{
        py: 1.5,
        height: "100%",
        flexDirection: "column",
        alignItems: "flex-start",
        textAlign: "left",
        textTransform: "none",
        "& .MuiButton-endIcon": {
          position: "absolute",
          top: "50%",
          right: 16,
          transform: "translateY(-50%)",
          margin: 0,
        },
      }}
    >
      <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.9 }}>
        {description}
      </Typography>
    </Button>
  )
}
