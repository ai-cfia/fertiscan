// ============================== Locale cookie (server) ==============================

import { createServerFn } from "@tanstack/react-start"
import { setCookie } from "@tanstack/react-start/server"
import {
  type AppLocale,
  LOCALE_COOKIE,
  LOCALE_MAX_AGE_SEC,
} from "#/i18n/locale"

type SetLocaleBody = { locale: AppLocale }

function assertSetLocaleBody(data: unknown): SetLocaleBody {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const locale = (data as Record<string, unknown>).locale
  if (locale !== "en" && locale !== "fr") {
    throw new Error("Invalid locale")
  }
  return { locale }
}

export const setLocaleCookieFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertSetLocaleBody(data))
  .handler(({ data }) => {
    setCookie(LOCALE_COOKIE, data.locale, {
      path: "/",
      maxAge: LOCALE_MAX_AGE_SEC,
      sameSite: "lax",
    })
  })
