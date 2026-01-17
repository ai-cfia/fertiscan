import type { ReactNode } from "react"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

// ============================== Types ==============================
interface AppBarActionsStore {
  actions: ReactNode | null
  setActions: (actions: ReactNode | null) => void
  clearActions: () => void
}

// ============================== Store ==============================
const store = (set: any): AppBarActionsStore => ({
  actions: null,
  setActions: (actions: ReactNode | null) => {
    set({ actions })
  },
  clearActions: () => {
    set({ actions: null })
  },
})

export const useAppBarActionsStore = create<AppBarActionsStore>()(
  devtools(store, { name: "AppBarActionsStore" }),
)
