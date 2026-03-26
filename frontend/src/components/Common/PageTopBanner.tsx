// ============================== Types ==============================
import { Alert, Box, Button, Typography } from "@mui/material"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

interface PageTopBannerProps {
  message: string | ReactNode
  items?: (string | ReactNode)[]
  severity?: "error" | "warning" | "info" | "success"
  onRetry?: () => void
  onDismiss?: () => void
}
// ============================== Component ==============================
export default function PageTopBanner({
  message,
  items,
  severity = "error",
  onRetry,
  onDismiss,
}: PageTopBannerProps) {
  const { t } = useTranslation("common")
  return (
    <Alert
      severity={severity}
      sx={{
        borderRadius: 0,
        borderBottom: 1,
        borderColor: "divider",
      }}
      action={
        <>
          {onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              {t("button.retry")}
            </Button>
          )}
          {onDismiss && (
            <Button color="inherit" size="small" onClick={onDismiss}>
              {t("button.dismiss")}
            </Button>
          )}
        </>
      }
    >
      {typeof message === "string" ? (
        <Typography
          variant="body2"
          component="div"
          sx={{ fontWeight: items ? 600 : undefined, mb: items ? 0.5 : 0 }}
        >
          {message}
        </Typography>
      ) : (
        message
      )}
      {items && items.length > 0 && (
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {items.map((item, index) => (
            <li key={index}>
              {typeof item === "string" ? (
                <Typography variant="body2">{item}</Typography>
              ) : (
                item
              )}
            </li>
          ))}
        </Box>
      )}
    </Alert>
  )
}
