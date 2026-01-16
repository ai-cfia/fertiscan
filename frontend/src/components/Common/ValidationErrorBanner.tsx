import { Alert, Box, Button, Typography } from "@mui/material"
import { useTranslation } from "react-i18next"
import { useLabelNew } from "@/stores/useLabelNew"

export default function ValidationErrorBanner() {
  const { t } = useTranslation(["errors", "common"])
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
          {t("button.dismiss", { ns: "common" })}
        </Button>
      }
    >
      <Typography
        variant="body2"
        component="div"
        sx={{ fontWeight: 600, mb: 0.5 }}
      >
        {t("fileType.invalidTitle")}
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
