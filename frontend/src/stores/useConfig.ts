// ============================== Client config (Vite env) ==============================
import { create } from "zustand"

interface ConfigStore {
  backendHealthCheckIntervalMs: number
  maxImagesPerLabel: number
  defaultPerPage: number
}
function envPositiveInt(v: string | undefined, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}
function envIntervalMs(v: string | undefined, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : fallback
}
export const clientRuntimeConfig: ConfigStore = {
  backendHealthCheckIntervalMs: envIntervalMs(
    import.meta.env.VITE_BACKEND_HEALTH_CHECK_INTERVAL_MS,
    15000,
  ),
  maxImagesPerLabel: envPositiveInt(
    import.meta.env.VITE_MAX_IMAGES_PER_LABEL,
    5,
  ),
  defaultPerPage: envPositiveInt(import.meta.env.VITE_DEFAULT_PER_PAGE, 10),
}
const store = () => clientRuntimeConfig
export const useConfig = create<ConfigStore>()(store)
