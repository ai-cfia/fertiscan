// ============================== Product type layout ==============================

import { createFileRoute, notFound, Outlet } from "@tanstack/react-router"

const VALID_PRODUCT_TYPES = ["fertilizer"] as const

export const Route = createFileRoute("/_layout/$productType")({
  beforeLoad: ({ params }) => {
    if (
      !VALID_PRODUCT_TYPES.includes(
        params.productType as (typeof VALID_PRODUCT_TYPES)[number],
      )
    ) {
      throw notFound()
    }
  },
  component: ProductTypeLayout,
})

function ProductTypeLayout() {
  return <Outlet />
}
