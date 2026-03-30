import { AxiosError } from "axios"
import type { StatusCodes } from "http-status-codes"

// ============================== Error Handling ==============================
type ErrorTranslate = (...args: any[]) => string
export function isAxiosErrorWithStatus(
  error: unknown,
  status: StatusCodes | StatusCodes[],
): error is AxiosError {
  if (!(error instanceof AxiosError)) return false
  const errorStatus = error.response?.status
  if (!errorStatus) return false
  return Array.isArray(status)
    ? status.includes(errorStatus)
    : errorStatus === status
}
export function getErrorMessage(error: unknown, t: ErrorTranslate): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data as any
    if (detail?.detail) {
      return typeof detail.detail === "string"
        ? detail.detail
        : Array.isArray(detail.detail) && detail.detail.length > 0
          ? detail.detail[0].msg || t("labels.errorOccurred", { ns: "errors" })
          : t("labels.errorOccurred", { ns: "errors" })
    }
    return error.message || t("labels.loadFailed", { ns: "errors" })
  }
  return t("labels.loadFailedRetry", { ns: "errors" })
}
