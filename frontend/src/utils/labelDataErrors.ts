import { AxiosError } from "axios"
import type { TFunction } from "i18next"

// ============================== Error Handling ==============================
export function getErrorMessage(error: unknown, t: TFunction): string {
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
