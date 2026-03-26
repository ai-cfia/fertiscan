import { create } from "zustand"

interface BackendStatusStore {
  ready: boolean
  lastCheck: Date | null
  setReady: () => void
  setNotReady: () => void
}
export const useBackendStatus = create<BackendStatusStore>()((set) => ({
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
}))
