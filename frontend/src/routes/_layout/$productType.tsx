import { createFileRoute, notFound, Outlet } from "@tanstack/react-router"
import { z } from "zod"
import NotFound from "@/components/Common/NotFound"

const VALID_PRODUCT_TYPES = ["fertilizer"] as const

const productTypeParamsSchema = z.object({
  productType: z.enum(VALID_PRODUCT_TYPES),
})

export const Route = createFileRoute("/_layout/$productType")({
  beforeLoad: async ({ params }) => {
    const result = productTypeParamsSchema.safeParse(params)
    if (!result.success) {
      throw notFound()
    }
  },
  parseParams: (params) => params,
  notFoundComponent: NotFound,
  component: ProductTypeLayout,
})

function ProductTypeLayout() {
  return <Outlet />
}
