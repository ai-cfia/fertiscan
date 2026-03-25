// ============================== Backend health (server → FastAPI) ==============================

import { createServerFn } from "@tanstack/react-start"
import { isAxiosError } from "axios"
import { HealthService } from "#/api"
import { createServerApiClient } from "#/server/api-client"

export const backendReadinessFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const client = createServerApiClient()
    const result = await HealthService.readiness({
      client,
      throwOnError: false,
    })
    if (isAxiosError(result)) {
      throw new Error(result.message || "Readiness check failed")
    }
    return result.data
  },
)
