// ============================== Home route ==============================

import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({
      to: "/$productType",
      params: { productType: "fertilizer" },
    })
  },
})
