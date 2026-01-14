import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface LabelListStore {
  error: Error | null
  setError: (error: Error | null) => void
}

const store = (set: any) => ({
  error: null,
  setError: (error: Error | null) => set({ error }),
})

export const useLabelList = create<LabelListStore>()(
  import.meta.env.DEV ? devtools(store, { name: "LabelList" }) : store,
)
