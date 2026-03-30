// ============================== i18n locale (server) ==============================
// --- Cookie then Accept-Language ---

import { getCookie, getRequestHeader } from "@tanstack/react-start/server"
import type { AppLocale } from "#/i18n/locale"

function parseAcceptLanguage(header: string | undefined): AppLocale {
  if (!header) {
    return "en"
  }
  const first = header.split(",")[0]?.trim().split("-")[0]?.toLowerCase()
  return first === "fr" ? "fr" : "en"
}

export function resolveLocaleFromServerRequest(): AppLocale {
  const c = getCookie("i18n-locale")
  if (c === "fr" || c === "en") {
    return c
  }
  return parseAcceptLanguage(getRequestHeader("accept-language"))
}
