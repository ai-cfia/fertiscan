import { create } from "zustand"

interface ProductListStore {
  error: Error | null
  setError: (error: Error | null) => void
}

const store = (set: any) => ({
  error: null,
  setError: (error: Error | null) => set({ error }),
})

export const useProductList = create<ProductListStore>()(store)
