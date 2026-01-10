import { createFileRoute, Outlet } from "@tanstack/react-router"
import { z } from "zod"

const VALID_PRODUCT_TYPES = ["fertilizer"] as const

const productTypeParamsSchema = z.object({
  productType: z.enum(VALID_PRODUCT_TYPES),
})

export const Route = createFileRoute("/_layout/$productType")({
  parseParams: (params) => productTypeParamsSchema.parse(params),
  component: ProductTypeLayout,
})

function ProductTypeLayout() {
  return <Outlet />
}
