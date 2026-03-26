// ============================== TanStack Start instance ==============================
// --- Global server function middleware (see integrations/tanstack-start/) ---

import { createStart } from "@tanstack/react-start"
import { globalServerFnBackendReadyMiddleware } from "#/integrations/tanstack-start/global-server-fn-middleware"

export const startInstance = createStart(() => ({
  functionMiddleware: [globalServerFnBackendReadyMiddleware],
}))
