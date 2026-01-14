import { Alert, Button } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { useLocation } from "@tanstack/react-router"
import { AxiosError } from "axios"
import { useEffect, useState } from "react"
import { useLabelList } from "@/stores/useLabelList"

export default function LabelListErrorBanner() {
  const location = useLocation()
  const { error, setError } = useLabelList()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(false)
  const isLabelsPage = location.pathname.includes("/labels")
  useEffect(() => {
    if (!error) {
      setDismissed(false)
    }
  }, [error])
  if (!isLabelsPage || !error || dismissed) {
    return null
  }
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
      const detail = error.response?.data as any
      if (detail?.detail) {
        return typeof detail.detail === "string"
          ? detail.detail
          : Array.isArray(detail.detail) && detail.detail.length > 0
            ? detail.detail[0].msg || "An error occurred"
            : "An error occurred"
      }
      return error.message || "Failed to load labels"
    }
    return "Failed to load labels. Please try again."
  }
  const handleRetry = () => {
    setError(null)
    queryClient.invalidateQueries({
      queryKey: ["labels"],
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
            Retry
          </Button>
          <Button
            color="inherit"
            size="small"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </Button>
        </>
      }
    >
      {getErrorMessage(error)}
    </Alert>
  )
}
