import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { backendReadinessFn } from "#/server/health"
import { useBackendStatus } from "#/stores/useBackendStatus"
import { useConfig } from "#/stores/useConfig"
export function useBackendHealthCheck() {
  const { setReady, setNotReady } = useBackendStatus()
  const { backendHealthCheckIntervalMs } = useConfig()
  const query = useQuery({
    queryKey: ["backend", "health", "readiness"],
    queryFn: () => backendReadinessFn(),
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
