// ============================== Global server-fn middleware ==============================
// --- Client: successful RPC marks backend reachable (useBackendStatus) ---

import { createMiddleware } from "@tanstack/react-start"
import { useBackendStatus } from "#/stores/useBackendStatus"

export const globalServerFnBackendReadyMiddleware = createMiddleware({
  type: "function",
}).client(async ({ next }) => {
  const result = await next()
  useBackendStatus.getState().setReady()
  return result
})
