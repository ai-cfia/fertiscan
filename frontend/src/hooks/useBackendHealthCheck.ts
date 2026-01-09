import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { HealthService } from "@/api"
import { useBackendStatus } from "@/stores/useBackendStatus"
import { useConfig } from "@/stores/useConfig"

/**
 * Polls backend readiness endpoint periodically and updates status store -
 * complements interceptor for proactive detection
 */
export function useBackendHealthCheck() {
  const { setReady, setNotReady } = useBackendStatus()
  const { backendHealthCheckIntervalMs } = useConfig()

  const query = useQuery({
    queryKey: ["backend", "health", "readiness"],
    queryFn: async () => {
      const response = await HealthService.readiness()
      if (response.error !== undefined) {
        throw response.error
      }
      return response.data
    },
    refetchInterval: backendHealthCheckIntervalMs,
    refetchIntervalInBackground: false,
    retry: 1,
    retryDelay: 1000,
  })

  useEffect(() => {
    if (query.isSuccess) {
      setReady()
    } else if (query.isError) {
      console.debug("Health check error:", query.error)
      setNotReady()
    }
  }, [query.isSuccess, query.isError, query.error, setReady, setNotReady])
}
