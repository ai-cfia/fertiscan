// ============================== Products list (server) ==============================
// --- Paginated /api/v1/products with session bearer ---

import { createServerFn } from "@tanstack/react-start"
import { isAxiosError } from "axios"
import { ProductsService } from "#/api"
import type { LimitOffsetPageProductPublic } from "#/api/types.gen"
import { requireAuthedApiClient } from "#/server/api-client"
import { messageFromAxiosApiError } from "#/server/api-error-message"

export type ReadProductsPageInput = {
  productType: string
  page: number
  perPage: number
  order_by?: string
  order?: "asc" | "desc"
}

function assertReadProductsPageInput(data: unknown): ReadProductsPageInput {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.productType !== "string" || o.productType.length === 0) {
    throw new Error("Invalid productType")
  }
  const page =
    typeof o.page === "number" && Number.isFinite(o.page) ? o.page : 0
  const perPage =
    typeof o.perPage === "number" && o.perPage > 0 && Number.isFinite(o.perPage)
      ? o.perPage
      : 10
  const order_by = typeof o.order_by === "string" ? o.order_by : undefined
  const order = o.order === "asc" || o.order === "desc" ? o.order : undefined
  return {
    productType: o.productType,
    page: Math.max(0, page),
    perPage,
    order_by,
    order,
  }
}

export const readProductsPageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertReadProductsPageInput(data))
  .handler(async ({ data }): Promise<LimitOffsetPageProductPublic> => {
    const client = await requireAuthedApiClient()
    const res = await ProductsService.readProducts({
      client,
      query: {
        product_type: data.productType,
        limit: data.perPage,
        offset: data.page * data.perPage,
        order_by: data.order_by,
        order: data.order,
      },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to load products"))
    }
    if (!res.data) {
      throw new Error("Failed to load products")
    }
    return res.data
  })

export type ReadProductsDuplicateCheckInput = {
  productType: string
  registrationNumber: string
}

function assertReadProductsDuplicateCheckInput(
  data: unknown,
): ReadProductsDuplicateCheckInput {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.productType !== "string" || o.productType.length === 0) {
    throw new Error("Invalid productType")
  }
  if (typeof o.registrationNumber !== "string") {
    throw new Error("Invalid registrationNumber")
  }
  const registrationNumber = o.registrationNumber.trim()
  if (registrationNumber.length === 0) {
    throw new Error("Invalid registrationNumber")
  }
  return { productType: o.productType, registrationNumber }
}

export const readProductsDuplicateCheckFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    assertReadProductsDuplicateCheckInput(data),
  )
  .handler(async ({ data }): Promise<LimitOffsetPageProductPublic> => {
    const client = await requireAuthedApiClient()
    const res = await ProductsService.readProducts({
      client,
      query: {
        product_type: data.productType,
        registration_number: data.registrationNumber,
        limit: 1,
        offset: 0,
      },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(
        messageFromAxiosApiError(res, "Failed to check registration number"),
      )
    }
    if (!res.data) {
      return {
        items: [],
        total: 0,
        limit: 1,
        offset: 0,
      }
    }
    return res.data
  })

// ============================== Delete product (server) ==============================

function assertProductIdInput(data: unknown): { productId: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.productId !== "string" || o.productId.length === 0) {
    throw new Error("Invalid productId")
  }
  return { productId: o.productId }
}

export const deleteProductFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertProductIdInput(data))
  .handler(async ({ data }): Promise<void> => {
    const client = await requireAuthedApiClient()
    const res = await ProductsService.deleteProduct({
      client,
      path: { product_id: data.productId },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to delete product"))
    }
  })
