// ============================== Server OpenAPI client ==============================
// --- Per-handler instance: base URL from env; optional auth callback for bearer ---
// --- Authenticated client (session bearer) ---

import { inspect } from "node:util"
import type { AxiosError } from "axios"
import type { Client } from "#/api/client"
import { createClient, createConfig } from "#/api/client"
import { getServerApiUrl } from "#/server/env"
import { getAppSession } from "#/server/session"

export const SERVER_REQUEST_TIMEOUT_MS = 30_000

const verbose = process.env.NODE_ENV !== "production"

export function createServerApiClient(auth?: () => string): Client {
  const client = createClient(
    createConfig({
      baseURL: getServerApiUrl(),
      throwOnError: false,
      timeout: SERVER_REQUEST_TIMEOUT_MS,
      ...(auth ? { auth } : {}),
    }),
  )
  if (verbose) {
    client.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const method = (error.config?.method ?? "get").toUpperCase()
        const url = error.config?.url ?? "<unknown>"
        const prefix = `[api] ${method} ${url}`
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error(
            `${prefix} ${error.response.status}\n${inspect(error.response.data, { depth: null })}\n${inspect(error.response.headers, { depth: null })}`,
          )
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser
          // and an instance of http.ClientRequest in node.js
          console.error(
            `${prefix} no response\n${inspect(error.request, { depth: 1 })}`,
          )
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error(`${prefix} error ${error.message}`)
        }
        return Promise.reject(error)
      },
    )
  }
  return client
}

export async function requireAuthedApiClient(): Promise<Client> {
  const session = await getAppSession()
  const token = session.data.accessToken
  if (!token) {
    throw new Error("Not authenticated")
  }
  return createServerApiClient(() => token)
}
