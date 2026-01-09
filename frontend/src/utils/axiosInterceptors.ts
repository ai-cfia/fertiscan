import type { AxiosError, AxiosResponse } from "axios"
import { StatusCodes } from "http-status-codes"
import { client } from "@/client/client.gen"
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

    const axiosInstance = client.instance

    if (!axiosInstance) {
      console.warn("Could not find axios instance for interceptor setup")
      return
    }

    interceptorId = axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Mark backend as ready on successful requests (handles recovery from
        // transient errors)
        const store = useBackendStatus.getState()
        if (!store.ready) {
          store.setReady()
        }
        return response
      },
      (error: AxiosError) => {
        // Mark backend as unavailable only for specific errors (not 500 which
        // is an app error)
        const store = useBackendStatus.getState()

        if (
          (error.response?.status &&
            BACKEND_UNAVAILABLE_STATUS.includes(error.response.status)) ||
          (error.code && NETWORK_ERROR_CODES.includes(error.code))
        ) {
          store.setNotReady()
        }

        return Promise.reject(error)
      },
    )
  }
})()
