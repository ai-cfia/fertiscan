import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { AxiosError } from "axios"
import { StatusCodes } from "http-status-codes"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { client as apiClient } from "@/api/client.gen"
import { SnackbarProvider } from "@/components/SnackbarProvider"
import { ThemeProvider } from "@/components/ThemeProvider"
import { useConfig } from "@/stores/useConfig"
import { setupBackendStatusInterceptor } from "@/utils/axiosInterceptors"
import "./i18n" // Initialize i18next before React render
import "./index.css"
import { routeTree } from "./routeTree.gen"

// Initialize language store after i18next is initialized
// Import the store to ensure it's initialized and synced with i18next
import("@/stores/useLanguage")

const { apiUrl } = useConfig.getState()
apiClient.setConfig({
  baseURL: apiUrl,
  auth: () => localStorage.getItem("access_token") || "",
  throwOnError: true,
})

setupBackendStatusInterceptor()

const handleApiError = (error: Error) => {
  if (
    error instanceof AxiosError &&
    error.response &&
    [StatusCodes.UNAUTHORIZED, StatusCodes.FORBIDDEN].includes(
      error.response.status,
    )
  ) {
    localStorage.removeItem("access_token")
    window.location.href = "/login"
  }
  console.error("API error:", error)
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
})

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <SnackbarProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
)
