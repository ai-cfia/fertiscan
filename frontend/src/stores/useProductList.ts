// ============================== Products list error surface ==============================

import { create } from "zustand"

type ProductListStore = {
  error: Error | null
  setError: (error: Error | null) => void
}

export const useProductList = create<ProductListStore>((set) => ({
  error: null,
  setError: (error) => set({ error }),
}))
