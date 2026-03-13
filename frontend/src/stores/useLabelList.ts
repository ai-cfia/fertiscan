import { create } from "zustand"

interface LabelListStore {
  error: Error | null
  setError: (error: Error | null) => void
}

const store = (set: any) => ({
  error: null,
  setError: (error: Error | null) => set({ error }),
})

export const useLabelList = create<LabelListStore>()(store)
