// ============================== Server OpenAPI client ==============================
// --- Per-handler instance: base URL from env; optional auth callback for bearer ---
// --- Authenticated client (session bearer) ---

import type { Client } from "#/api/client"
import { createClient, createConfig } from "#/api/client"
import { getServerApiUrl } from "#/server/env"
import { getAppSession } from "#/server/session"

export function createServerApiClient(auth?: () => string): Client {
  return createClient(
    createConfig({
      baseURL: getServerApiUrl(),
      throwOnError: false,
      ...(auth ? { auth } : {}),
    }),
  )
}

export async function requireAuthedApiClient(): Promise<Client> {
  const session = await getAppSession()
  const token = session.data.accessToken
  if (!token) {
    throw new Error("Not authenticated")
  }
  return createServerApiClient(() => token)
}
