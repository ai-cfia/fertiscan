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
import { client } from "@/client/client.gen"
import { SnackbarProvider } from "@/components/SnackbarProvider"
import { ThemeProvider } from "@/components/ThemeProvider"
import { useConfig } from "@/stores/useConfig"
import { setupBackendStatusInterceptor } from "@/utils/axiosInterceptors"
import "./index.css"
import { routeTree } from "./routeTree.gen"

const { apiUrl } = useConfig.getState()
client.setConfig({
  baseURL: apiUrl,
  auth: () => localStorage.getItem("access_token") || "",
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

const queryClient = new QueryClient({
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
