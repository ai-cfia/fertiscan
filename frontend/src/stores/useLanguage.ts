/**
 * Store for user language preference with localStorage persistence
 * Integrates with i18next for language switching
 */
import { create } from "zustand"
import { persist } from "zustand/middleware"

type Language = "en" | "fr"

interface LanguageStore {
  language: Language
  setLanguage: (lang: Language) => void
}

// Get initial language - reads from i18next's current language
// This function is called when the store initializes, at which point i18next is already initialized
const getInitialLanguage = (): Language => {
  // Try to read from i18next (it's already initialized by the time this runs)
  // Access via window.__i18next which is set in i18n.ts
  const i18nInstance = (window as any).__i18next
  if (i18nInstance?.language && ["en", "fr"].includes(i18nInstance.language)) {
    return i18nInstance.language as Language
  }

  // Fallback: check localStorage (Zustand persist format)
  const savedLang = localStorage.getItem("language-preference")
  if (savedLang) {
    try {
      const parsed = JSON.parse(savedLang)
      if (
        parsed?.state?.language &&
        ["en", "fr"].includes(parsed.state.language)
      ) {
        return parsed.state.language as Language
      }
    } catch {
      // Invalid JSON, continue
    }
  }

  // Final fallback: browser language or default
  const browserLang = navigator.language.split("-")[0]
  return (["en", "fr"].includes(browserLang) ? browserLang : "en") as Language
}

const store = (set: (state: Partial<LanguageStore>) => void) => ({
  language: getInitialLanguage(),
  setLanguage: (lang: Language) => {
    set({ language: lang })
    // Sync with i18next (imported dynamically to avoid circular dependency)
    import("@/i18n").then(({ default: i18n }) => {
      i18n.changeLanguage(lang)
    })
  },
})

const persistedStore = persist(store, {
  name: "language-preference",
})

export const useLanguage = create<LanguageStore>()(
  persistedStore as typeof persistedStore,
)
