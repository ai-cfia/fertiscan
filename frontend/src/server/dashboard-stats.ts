// ============================== Dashboard stats (server) ==============================
// --- Aggregates label/product counts using session bearer token ---

import { createServerFn } from "@tanstack/react-start"
import { isAxiosError } from "axios"
import { LabelsService, ProductsService } from "#/api"
import type { Client } from "#/api/client"
import type { ReviewStatus } from "#/api/types.gen"
import { requireAuthedApiClient } from "#/server/api-client"
import { messageFromAxiosApiError } from "#/server/api-error-message"

export type DashboardStats = {
  totalLabels: number
  notStarted: number
  inProgress: number
  completed: number
  totalProducts: number
  unlinkedLabels: number
}

function assertProductTypeBody(data: unknown): { productType: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const pt = (data as Record<string, unknown>).productType
  if (typeof pt !== "string" || pt.length === 0) {
    throw new Error("Invalid productType")
  }
  return { productType: pt }
}

async function labelsTotal(
  client: Client,
  productType: string,
  extra: { review_status?: ReviewStatus; unlinked?: boolean } = {},
): Promise<number> {
  const res = await LabelsService.readLabels({
    client,
    query: { product_type: productType, limit: 1, ...extra },
    throwOnError: false,
  })
  if (isAxiosError(res)) {
    throw new Error(
      messageFromAxiosApiError(res, "Failed to load label statistics"),
    )
  }
  return res.data.total
}

async function productsTotal(
  client: Client,
  productType: string,
): Promise<number> {
  const res = await ProductsService.readProducts({
    client,
    query: { product_type: productType, limit: 1 },
    throwOnError: false,
  })
  if (isAxiosError(res)) {
    throw new Error(
      messageFromAxiosApiError(res, "Failed to load product statistics"),
    )
  }
  return res.data.total
}

export const getDashboardStatsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertProductTypeBody(data))
  .handler(async ({ data }): Promise<DashboardStats> => {
    const client = await requireAuthedApiClient()
    const { productType } = data
    const [
      totalLabels,
      notStarted,
      inProgress,
      completed,
      totalProducts,
      unlinkedLabels,
    ] = await Promise.all([
      labelsTotal(client, productType),
      labelsTotal(client, productType, { review_status: "not_started" }),
      labelsTotal(client, productType, { review_status: "in_progress" }),
      labelsTotal(client, productType, { review_status: "completed" }),
      productsTotal(client, productType),
      labelsTotal(client, productType, { unlinked: true }),
    ])
    return {
      totalLabels,
      notStarted,
      inProgress,
      completed,
      totalProducts,
      unlinkedLabels,
    }
  })
