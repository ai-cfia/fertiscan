/**
 * Store for backend availability status - single source of truth updated by
 * health check and interceptors
 */
import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface BackendStatusStore {
  ready: boolean
  lastCheck: Date | null
  setReady: () => void
  setNotReady: () => void
}

const store = (set: any) => ({
  ready: true,
  lastCheck: null,
  setReady: () =>
    set({
      ready: true,
      lastCheck: new Date(),
    }),
  setNotReady: () =>
    set({
      ready: false,
      lastCheck: new Date(),
    }),
})

export const useBackendStatus = create<BackendStatusStore>()(
  import.meta.env.DEV ? devtools(store, { name: "BackendStatus" }) : store,
)
