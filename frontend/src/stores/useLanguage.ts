// ============================== Language preference ==============================

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { changeAppLocale } from "#/i18n/active-i18n"
import { type AppLocale, readClientLocale } from "#/i18n/locale"
import { setLocaleCookieFn } from "#/server/locale"

type LanguageStore = {
  language: AppLocale
  setLanguage: (lang: AppLocale) => void
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: readClientLocale(),
      setLanguage: (lang) => {
        set({ language: lang })
        void setLocaleCookieFn({ data: { locale: lang } })
        void changeAppLocale(lang)
      },
    }),
    { name: "language-preference" },
  ),
)
