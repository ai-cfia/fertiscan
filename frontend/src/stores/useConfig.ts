/**
 * Centralized config store for environment variables - avoids direct env access
 * throughout codebase
 */
import { create } from "zustand"

interface ConfigStore {
  backendHealthCheckIntervalMs: number
  apiUrl: string
  maxImagesPerLabel: number
  defaultPerPage: number
}

const config = {
  backendHealthCheckIntervalMs:
    Number(import.meta.env.VITE_BACKEND_HEALTH_CHECK_INTERVAL_MS) || 15000,
  apiUrl: import.meta.env.VITE_API_URL || "",
  maxImagesPerLabel: 5,
  defaultPerPage: 10,
}

const store = () => config

export const useConfig = create<ConfigStore>()(store)
