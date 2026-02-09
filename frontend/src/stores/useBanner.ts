import type { ReactNode } from "react"
import { create } from "zustand"

// ============================== Types ==============================
export interface Banner {
  id: string
  message: string | ReactNode
  items?: (string | ReactNode)[]
  severity?: "error" | "warning" | "info" | "success"
  onRetry?: () => void
  onDismiss?: () => void
}

interface BannerStore {
  banners: Banner[]
  showBanner: (banner: Banner) => void
  dismissBanner: (id: string) => void
  clearBanners: () => void
  updateBanner: (id: string, updates: Partial<Banner>) => void
}

// ============================== Store ==============================
const store = (set: any) => ({
  banners: [],
  showBanner: (banner: Banner) =>
    set((state: BannerStore) => ({
      banners: [...state.banners.filter((b) => b.id !== banner.id), banner],
    })),
  dismissBanner: (id: string) =>
    set((state: BannerStore) => ({
      banners: state.banners.filter((b) => b.id !== id),
    })),
  clearBanners: () => set({ banners: [] }),
  updateBanner: (id: string, updates: Partial<Banner>) =>
    set((state: BannerStore) => ({
      banners: state.banners.map((b) =>
        b.id === id ? { ...b, ...updates } : b,
      ),
    })),
})

export const useBanner = create<BannerStore>()(store)
