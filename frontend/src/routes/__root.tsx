// ============================== Root route ==============================

import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  getRouteApi,
  HeadContent,
  Scripts,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import { SnackbarProvider } from "#/components/SnackbarProvider"
import { ThemeProvider } from "#/components/ThemeProvider"
import { DocumentLang, I18nProvider } from "#/i18n/provider"
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools"
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider"
import appCss from "../styles.css?url"

export type AppLocale = "en" | "fr"

interface MyRouterContext {
  queryClient: QueryClient
}

const rootRouteApi = getRouteApi("__root__")

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    let locale: AppLocale = "en"
    if (import.meta.env.SSR) {
      const { resolveLocaleFromServerRequest } = await import(
        "#/i18n/resolve-locale.server"
      )
      locale = resolveLocaleFromServerRequest()
    } else {
      const { readClientLocale } = await import("#/i18n/locale")
      locale = readClientLocale()
    }
    return { locale }
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Fertiscan",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { locale } = rootRouteApi.useRouteContext()
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh antialiased">
        <I18nProvider initialLocale={locale}>
          <DocumentLang />
          <ThemeProvider>
            <SnackbarProvider>
              <TanStackQueryProvider>
                {children}
                <TanStackDevtools
                  config={{
                    position: "bottom-right",
                  }}
                  plugins={[
                    {
                      name: "Tanstack Router",
                      render: <TanStackRouterDevtoolsPanel />,
                    },
                    TanStackQueryDevtools,
                  ]}
                />
              </TanStackQueryProvider>
            </SnackbarProvider>
          </ThemeProvider>
        </I18nProvider>
        <Scripts />
      </body>
    </html>
  )
}
