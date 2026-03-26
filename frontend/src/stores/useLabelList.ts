// ============================== Labels list error surface ==============================

import { create } from "zustand"

type LabelListStore = {
  error: Error | null
  setError: (error: Error | null) => void
}

export const useLabelList = create<LabelListStore>((set) => ({
  error: null,
  setError: (error) => set({ error }),
}))
