import { Alert, Box, Button, LinearProgress } from "@mui/material"
import { useEffect, useMemo, useState } from "react"
import { useLabelNew } from "@/stores/useLabelNew"

export default function UploadProgressBanner() {
  const { uploadStatesByLabelId, labelId } = useLabelNew()
  const [dismissed, setDismissed] = useState(false)
  // ============================== Calculate Progress ==============================
  const progress = useMemo(() => {
    if (!labelId) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        failed: 0,
        overallProgress: 0,
        allDone: true,
      }
    }
    const labelStates = uploadStatesByLabelId.get(labelId)
    if (!labelStates) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        failed: 0,
        overallProgress: 0,
        allDone: true,
      }
    }
    let total = 0
    let completed = 0
    let inProgress = 0
    let failed = 0
    let totalProgress = 0
    labelStates.forEach((state) => {
      total++
      if (state.status === "success") {
        completed++
        totalProgress += 100
      } else if (state.status === "failed") {
        failed++
      } else if (
        state.status === "pending" ||
        state.status === "requesting" ||
        state.status === "uploading"
      ) {
        inProgress++
        totalProgress += state.progress || 0
      }
    })
    const overallProgress = total > 0 ? Math.round(totalProgress / total) : 0
    const allDone = inProgress === 0 && total > 0
    return { total, completed, inProgress, failed, overallProgress, allDone }
  }, [uploadStatesByLabelId, labelId])
  // ============================== Effects ==============================
  useEffect(() => {
    if (progress.inProgress > 0) {
      setDismissed(false)
    }
  }, [progress.inProgress])
  // ============================== Render ==============================
  if (progress.allDone || progress.total === 0 || dismissed) {
    return null
  }
  const message =
    progress.inProgress > 0
      ? `Uploading ${progress.completed + progress.inProgress} of ${progress.total} file${progress.total !== 1 ? "s" : ""}...`
      : progress.completed > 0
        ? `${progress.completed} of ${progress.total} file${progress.total !== 1 ? "s" : ""} uploaded`
        : "Preparing uploads..."
  return (
    <Alert
      severity="info"
      sx={{
        borderRadius: 0,
        borderBottom: 1,
        borderColor: "divider",
      }}
      icon={false}
      action={
        <Button color="inherit" size="small" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      }
    >
      <Box sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box sx={{ flexGrow: 1, mr: 2 }}>{message}</Box>
          <Box sx={{ minWidth: 100, textAlign: "right" }}>
            {progress.overallProgress}%
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress.overallProgress}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
    </Alert>
  )
}
