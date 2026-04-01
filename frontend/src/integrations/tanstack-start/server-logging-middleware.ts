// ============================== Server-side logging middleware ==============================
// --- Logs every server function call: name, duration, and errors ---

import { isNotFound, isRedirect } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"

const verbose = process.env.NODE_ENV !== "production"

export const serverLoggingMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next, method, serverFnMeta }) => {
  const label = `${method} ${serverFnMeta.filename}:${serverFnMeta.name}`
  const start = performance.now()
  try {
    const result = await next()
    if (verbose) {
      const ms = (performance.now() - start).toFixed(1)
      console.log(`[server-fn] ${label} OK ${ms}ms`)
    }
    return result
  } catch (error) {
    const ms = (performance.now() - start).toFixed(1)
    if (isRedirect(error)) {
      if (verbose) {
        console.log(`[server-fn] ${label} REDIRECT ${ms}ms`)
      }
    } else if (isNotFound(error)) {
      if (verbose) {
        console.log(`[server-fn] ${label} NOT_FOUND ${ms}ms`)
      }
    } else {
      const detail = error instanceof Error ? error.message : String(error)
      console.error(`[server-fn] ${label} ERR ${ms}ms ${detail}`)
    }
    throw error
  }
})
