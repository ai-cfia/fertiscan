import { Alert, Box, Button, Typography } from "@mui/material"
import { useLabelNew } from "@/stores/useLabelNew"

export default function ValidationErrorBanner() {
  const { fileTypeValidationErrors, clearFileTypeValidationErrors } =
    useLabelNew()
  if (fileTypeValidationErrors.length === 0) {
    return null
  }
  return (
    <Alert
      severity="error"
      sx={{
        borderRadius: 0,
        borderBottom: 1,
        borderColor: "divider",
      }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={clearFileTypeValidationErrors}
        >
          Dismiss
        </Button>
      }
    >
      <Typography
        variant="body2"
        component="div"
        sx={{ fontWeight: 600, mb: 0.5 }}
      >
        Invalid file types:
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        {fileTypeValidationErrors.map((error, index) => (
          <li key={index}>
            <Typography variant="body2">{error}</Typography>
          </li>
        ))}
      </Box>
    </Alert>
  )
}
