// ============================== Labels list (server) ==============================
// --- Paginated /api/v1/labels with session bearer ---

import { createServerFn } from "@tanstack/react-start"
import { isAxiosError } from "axios"
import { LabelsService } from "#/api"
import type {
  LimitOffsetPageLabelListItem,
  ReviewStatus,
} from "#/api/types.gen"
import { requireAuthedApiClient } from "#/server/api-client"
import { messageFromAxiosApiError } from "#/server/api-error-message"

export type ReadLabelsPageInput = {
  productType: string
  page: number
  perPage: number
  review_status?: ReviewStatus
  unlinked?: boolean
  order_by?: string
  order?: "asc" | "desc"
}

const REVIEW: readonly ReviewStatus[] = [
  "not_started",
  "in_progress",
  "completed",
]

function assertReadLabelsPageInput(data: unknown): ReadLabelsPageInput {
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
  let review_status: ReviewStatus | undefined
  if (
    typeof o.review_status === "string" &&
    REVIEW.includes(o.review_status as ReviewStatus)
  ) {
    review_status = o.review_status as ReviewStatus
  }
  const unlinked = o.unlinked === true ? true : undefined
  const order_by = typeof o.order_by === "string" ? o.order_by : undefined
  const order = o.order === "asc" || o.order === "desc" ? o.order : undefined
  return {
    productType: o.productType,
    page: Math.max(0, page),
    perPage,
    review_status,
    unlinked,
    order_by,
    order,
  }
}

export const readLabelsPageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertReadLabelsPageInput(data))
  .handler(async ({ data }): Promise<LimitOffsetPageLabelListItem> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.readLabels({
      client,
      query: {
        product_type: data.productType,
        limit: data.perPage,
        offset: data.page * data.perPage,
        review_status: data.review_status,
        unlinked: data.unlinked,
        order_by: data.order_by,
        order: data.order,
      },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to load labels"))
    }
    return res.data
  })
