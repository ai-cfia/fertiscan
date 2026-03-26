// ============================== i18n locale ==============================
// --- Cookie + persisted preference + browser fallback ---

export type AppLocale = "en" | "fr"

export const LOCALE_COOKIE = "i18n-locale"

export const LOCALE_MAX_AGE_SEC = 60 * 60 * 24 * 365

export function readClientLocale(): AppLocale {
  if (typeof document === "undefined") {
    return "en"
  }
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  )
  const fromCookie = m?.[1] ? decodeURIComponent(m[1]) : undefined
  if (fromCookie === "fr" || fromCookie === "en") {
    return fromCookie
  }
  const savedLang = localStorage.getItem("language-preference")
  if (savedLang) {
    try {
      const parsed = JSON.parse(savedLang) as {
        state?: { language?: string }
      }
      const lang = parsed?.state?.language
      if (lang === "fr" || lang === "en") {
        return lang
      }
    } catch {
      /* ignore */
    }
  }
  const browserLang = navigator.language.split("-")[0]?.toLowerCase()
  return browserLang === "fr" ? "fr" : "en"
}
