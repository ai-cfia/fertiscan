import { Alert, Button } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useBackendStatus } from "@/stores/useBackendStatus"

export default function BackendStatusBanner() {
  const { t } = useTranslation("common")
  const { ready } = useBackendStatus()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (ready) {
      setDismissed(false)
    }
  }, [ready])

  if (ready || dismissed) {
    return null
  }

  const handleRetry = () => {
    queryClient.invalidateQueries({
      queryKey: ["backend", "health", "readiness"],
    })
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
        <>
          <Button color="inherit" size="small" onClick={handleRetry}>
            {t("button.retry")}
          </Button>
          <Button
            color="inherit"
            size="small"
            onClick={() => setDismissed(true)}
          >
            {t("button.dismiss")}
          </Button>
        </>
      }
    >
      {t("backend.unavailable")}
    </Alert>
  )
}
