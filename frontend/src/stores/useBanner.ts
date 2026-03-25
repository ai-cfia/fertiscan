// ============================== Stacked page banners ==============================

import type { ReactNode } from "react"
import { create } from "zustand"

export type Banner = {
  id: string
  message: string | ReactNode
  items?: (string | ReactNode)[]
  severity?: "error" | "warning" | "info" | "success"
  onRetry?: () => void
  onDismiss?: () => void
}

type BannerStore = {
  banners: Banner[]
  showBanner: (banner: Banner) => void
  dismissBanner: (id: string) => void
  clearBanners: () => void
  updateBanner: (id: string, updates: Partial<Banner>) => void
}

export const useBanner = create<BannerStore>((set) => ({
  banners: [],
  showBanner: (banner) =>
    set((state) => ({
      banners: [...state.banners.filter((b) => b.id !== banner.id), banner],
    })),
  dismissBanner: (id) =>
    set((state) => ({
      banners: state.banners.filter((b) => b.id !== id),
    })),
  clearBanners: () => set({ banners: [] }),
  updateBanner: (id, updates) =>
    set((state) => ({
      banners: state.banners.map((b) =>
        b.id === id ? { ...b, ...updates } : b,
      ),
    })),
}))
