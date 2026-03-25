// ============================== i18n provider ==============================

import { type ReactNode, useEffect, useRef } from "react"
import { I18nextProvider, useTranslation } from "react-i18next"
import { registerActiveI18n } from "#/i18n/active-i18n"
import { createAppI18n } from "#/i18n/create-app-i18n"
import type { AppLocale } from "#/i18n/locale"

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale
  children: ReactNode
}) {
  const i18nRef = useRef<ReturnType<typeof createAppI18n> | null>(null)
  if (!i18nRef.current) {
    i18nRef.current = createAppI18n(initialLocale)
  }
  const i18n = i18nRef.current
  useEffect(() => {
    registerActiveI18n(i18n)
    return () => registerActiveI18n(null)
  }, [i18n])
  useEffect(() => {
    void i18n.changeLanguage(initialLocale)
  }, [i18n, initialLocale])
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export function DocumentLang() {
  const { i18n } = useTranslation()
  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])
  return null
}
