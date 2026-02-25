import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import authEn from "./locales/en/auth.json"
// Import translation files
import commonEn from "./locales/en/common.json"
import errorsEn from "./locales/en/errors.json"
import labelsEn from "./locales/en/labels.json"
import productsEn from "./locales/en/products.json"
import authFr from "./locales/fr/auth.json"
import commonFr from "./locales/fr/common.json"
import errorsFr from "./locales/fr/errors.json"
import labelsFr from "./locales/fr/labels.json"
import productsFr from "./locales/fr/products.json"

const resources = {
  en: {
    common: commonEn,
    labels: labelsEn,
    auth: authEn,
    errors: errorsEn,
    products: productsEn,
  },
  fr: {
    common: commonFr,
    labels: labelsFr,
    auth: authFr,
    errors: errorsFr,
    products: productsFr,
  },
}

// Custom language detection order: saved preference → browser → default
const getInitialLanguage = (): string => {
  // 1. Check saved preference in localStorage (same key as Zustand persist)
  const savedLang = localStorage.getItem("language-preference")
  if (savedLang) {
    try {
      const parsed = JSON.parse(savedLang)
      if (
        parsed?.state?.language &&
        ["en", "fr"].includes(parsed.state.language)
      ) {
        return parsed.state.language
      }
    } catch {
      // Invalid JSON, continue to next check
    }
  }

  // 2. Check browser language
  const browserLang = navigator.language.split("-")[0]
  if (["en", "fr"].includes(browserLang)) {
    return browserLang
  }

  // 3. Default to English
  return "en"
}

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Initial language from detection order
    lng: getInitialLanguage(),
    // Fallback language
    fallbackLng: "en",
    // Default namespace
    defaultNS: "common",
    // Namespaces to preload
    ns: ["common"],
    // Resources
    resources,
    // Language detection options
    detection: {
      // Order: saved preference → browser → default
      order: ["localStorage", "navigator"],
      // Cache user language
      caches: ["localStorage"],
      // localStorage key (will be managed by Zustand, but detector can also use it)
      lookupLocalStorage: "language-preference",
    },
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Development mode options
    debug: import.meta.env.DEV,
    // Save missing keys in development
    saveMissing: import.meta.env.DEV,
    // Missing key handler
    missingKeyHandler: (lng, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(
          `Missing translation key: ${key} in namespace: ${ns} for language: ${lng}`,
        )
      }
    },
    // React options
    react: {
      useSuspense: false, // Disable suspense for better error handling
    },
  })

// Expose i18next instance on window for store initialization (optional, for easier access)
if (typeof window !== "undefined") {
  ;(window as any).__i18next = i18n
}

export default i18n
