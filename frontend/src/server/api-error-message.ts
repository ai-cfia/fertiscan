// ============================== API error message from Axios ==============================

import type { AxiosError } from "axios"
import type { ValidationError } from "#/api/types.gen"

export function messageFromAxiosApiError(
  err: AxiosError,
  fallback = "Request failed",
): string {
  const data = err.response?.data as
    | { detail?: string | ValidationError[] }
    | undefined
  const detail = data?.detail
  if (Array.isArray(detail) && detail.length > 0 && detail[0]?.msg) {
    return String(detail[0].msg)
  }
  if (typeof detail === "string") {
    return detail
  }
  return fallback
}
