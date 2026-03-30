// ============================== i18n factory ==============================

import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import type { AppLocale } from "#/i18n/locale"
import { resources } from "#/i18n/resources"

export function createAppI18n(lng: AppLocale) {
  const inst = i18next.createInstance()
  inst.use(initReactI18next).init({
    lng,
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "labels", "auth", "errors", "products"],
    resources,
    interpolation: { escapeValue: false },
    debug: import.meta.env.DEV,
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (l, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(
          `Missing translation key: ${key} namespace: ${ns} lang: ${l}`,
        )
      }
    },
    react: { useSuspense: false },
    initImmediate: false,
  })
  return inst
}
