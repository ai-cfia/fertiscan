// ============================== Active i18n (for non-React callers) ==============================

import type { i18n } from "i18next"
import type { AppLocale } from "#/i18n/locale"

let active: i18n | null = null

export function registerActiveI18n(instance: i18n | null) {
  active = instance
}

export function changeAppLocale(lang: AppLocale) {
  return active?.changeLanguage(lang)
}
