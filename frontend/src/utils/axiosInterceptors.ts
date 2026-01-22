import { StatusCodes } from "http-status-codes"
import { client as apiClient } from "@/api/client.gen"
import { useBackendStatus } from "@/stores/useBackendStatus"

// Status codes indicating backend unavailability (not application errors like
// 500)
const BACKEND_UNAVAILABLE_STATUS = [
  StatusCodes.BAD_GATEWAY,
  StatusCodes.SERVICE_UNAVAILABLE,
  StatusCodes.GATEWAY_TIMEOUT,
]

// Network errors indicating backend is unreachable
const NETWORK_ERROR_CODES = ["ECONNREFUSED", "ETIMEDOUT", "ERR_NETWORK"]

/**
 * Interceptor for immediate backend availability detection on every request
 * Complements health check polling by detecting issues instantly when users
 * interact
 */
export const setupBackendStatusInterceptor = (() => {
  let interceptorId: number | null = null

  return () => {
    if (interceptorId !== null) {
      return
    }

    interceptorId = apiClient.interceptors.response.use((response) => {
      // Mark backend as ready on successful requests (handles recovery from
      // transient errors)
      const store = useBackendStatus.getState()
      if (!store.ready) {
        store.setReady()
      }
      return response
    })

    apiClient.interceptors.error.use((error, response) => {
      // Mark backend as unavailable only for specific errors (not 500 which
      // is an app error)
      const store = useBackendStatus.getState()

      if (
        (response instanceof Response &&
          BACKEND_UNAVAILABLE_STATUS.includes(response.status)) ||
        (error instanceof Error &&
          NETWORK_ERROR_CODES.some((code) => error.message.includes(code)))
      ) {
        store.setNotReady()
      }

      return error
    })
  }
})()
