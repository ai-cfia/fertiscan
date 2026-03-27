// ============================== Global upload progress ==============================

import { Alert, Box, Button, LinearProgress } from "@mui/material"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLabelNew } from "#/stores/useLabelNew"

export default function UploadProgressBanner() {
  const { t } = useTranslation(["labels", "common"])
  const { uploadStatesByLabelId, labelId } = useLabelNew()
  const [dismissed, setDismissed] = useState(false)
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
  useEffect(() => {
    if (progress.inProgress > 0) {
      setDismissed(false)
    }
  }, [progress.inProgress])
  if (progress.allDone || progress.total === 0 || dismissed) {
    return null
  }
  const message =
    progress.inProgress > 0
      ? t("labels.upload.uploading", {
          current: String(progress.completed + progress.inProgress),
          total: String(progress.total),
          count: progress.total,
        })
      : progress.completed > 0
        ? t("labels.upload.uploaded", {
            completed: String(progress.completed),
            total: String(progress.total),
            count: progress.total,
          })
        : t("labels.upload.preparing")
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
          {t("button.dismiss", { ns: "common" })}
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
