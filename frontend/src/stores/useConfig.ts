/**
 * Centralized config store for environment variables - avoids direct env access
 * throughout codebase
 */
import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface ConfigStore {
  backendHealthCheckIntervalMs: number
  apiUrl: string
}

const config = {
  backendHealthCheckIntervalMs:
    Number(import.meta.env.VITE_BACKEND_HEALTH_CHECK_INTERVAL_MS) || 15000,
  apiUrl: import.meta.env.VITE_API_URL || "",
}

const store = () => config

export const useConfig = create<ConfigStore>()(
  import.meta.env.DEV ? devtools(store, { name: "Config" }) : store,
)
