// ============================== App bar action slot ==============================

import type { ReactNode } from "react"
import { create } from "zustand"

type AppBarActionsStore = {
  actions: ReactNode | null
  setActions: (actions: ReactNode | null) => void
  clearActions: () => void
}

export const useAppBarActionsStore = create<AppBarActionsStore>((set) => ({
  actions: null,
  setActions: (actions) => set({ actions }),
  clearActions: () => set({ actions: null }),
}))
