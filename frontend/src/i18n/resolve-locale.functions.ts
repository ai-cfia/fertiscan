// ============================== i18n locale (server) ==============================
// --- Cookie then Accept-Language ---

import { createServerFn } from "@tanstack/react-start"
import { getCookie, getRequestHeader } from "@tanstack/react-start/server"
import type { AppLocale } from "#/i18n/locale"

function parseAcceptLanguage(header: string | undefined): AppLocale {
  if (!header) {
    return "en"
  }
  const first = header.split(",")[0]?.trim().split("-")[0]?.toLowerCase()
  return first === "fr" ? "fr" : "en"
}

export const resolveLocaleFromServerRequest = createServerFn().handler(
  async (): Promise<AppLocale> => {
    const c = getCookie("i18n-locale")
    if (c === "fr" || c === "en") {
      return c
    }
    return parseAcceptLanguage(getRequestHeader("accept-language"))
  },
)
