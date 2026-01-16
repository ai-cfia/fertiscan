import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useSnackbar } from "@/components/SnackbarProvider"
import { useLabelNew } from "@/stores/useLabelNew"

export default function UploadCompletionSnackbar() {
  const { t } = useTranslation("labels")
  const { uploadStatesByLabelId, labelId } = useLabelNew()
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const previousInProgressRef = useRef(false)
  // ============================== Effects ==============================
  useEffect(() => {
    if (!labelId) {
      previousInProgressRef.current = false
      return
    }
    const labelStates = uploadStatesByLabelId.get(labelId)
    if (!labelStates) {
      previousInProgressRef.current = false
      return
    }
    let total = 0
    let completed = 0
    let inProgress = 0
    let failed = 0
    labelStates.forEach((state) => {
      total++
      if (state.status === "success") {
        completed++
      } else if (state.status === "failed") {
        failed++
      } else if (
        state.status === "pending" ||
        state.status === "requesting" ||
        state.status === "uploading"
      ) {
        inProgress++
      }
    })
    const isDone = inProgress === 0 && total > 0
    const wasInProgress = previousInProgressRef.current
    if (wasInProgress && isDone) {
      if (failed === 0) {
        showSuccessToast(
          t("upload.success", { completed, total, count: total }),
        )
      } else if (completed === 0) {
        showErrorToast(t("upload.failed", { failed, total, count: total }))
      } else {
        showErrorToast(t("upload.partial", { completed, failed }))
      }
    }
    previousInProgressRef.current = inProgress > 0
  }, [uploadStatesByLabelId, labelId, showSuccessToast, showErrorToast, t])
  return null
}
