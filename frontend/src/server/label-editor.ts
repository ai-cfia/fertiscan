// ============================== Label editor (server) ==============================
// --- Authenticated label/product API for edit page (browser has no API bearer) ---

import { createServerFn } from "@tanstack/react-start"
import axios, { isAxiosError } from "axios"
import { StatusCodes } from "http-status-codes"
import { LabelsService, ProductsService } from "#/api"
import type { Client } from "#/api/client"
import type {
  ExtractFertilizerFieldsOutput,
  FertilizerLabelData,
  FertilizerLabelDataMetaResponse,
  LabelData,
  LabelDataFieldMetaResponse,
  LabelDetail,
  LabelImageDetail,
  LimitOffsetPageProductPublic,
  ProductPublic,
  ReviewStatus,
} from "#/api/types.gen"
import {
  SERVER_REQUEST_TIMEOUT_MS,
  requireAuthedApiClient,
} from "#/server/api-client"
import { messageFromAxiosApiError } from "#/server/api-error-message"

function assertLabelId(data: unknown): { labelId: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  return { labelId: o.labelId }
}

function assertReadLabelForRoute(data: unknown): {
  labelId: string
  productType: string
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  if (typeof o.productType !== "string" || o.productType.length === 0) {
    throw new Error("Invalid productType")
  }
  return { labelId: o.labelId, productType: o.productType }
}

export type ReadLabelForRouteResult =
  | { outcome: "not_found" }
  | { outcome: "redirect"; productType: string; labelId: string }
  | { outcome: "ok"; label: LabelDetail; isLinked: boolean }

export const readLabelForRouteFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertReadLabelForRoute(data))
  .handler(async ({ data }): Promise<ReadLabelForRouteResult> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.readLabel({
      client,
      path: { label_id: data.labelId },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      const status = res.response?.status
      const errorData = res.response?.data as {
        detail?: Array<{ type?: string }>
      }
      const isUuidParsingError =
        status === 422 &&
        Array.isArray(errorData?.detail) &&
        errorData.detail.some((err) => err.type === "uuid_parsing")
      if (status === 404 || isUuidParsingError) {
        return { outcome: "not_found" }
      }
      throw new Error(messageFromAxiosApiError(res, "Failed to load label"))
    }
    const label = res.data
    if (!label) {
      return { outcome: "not_found" }
    }
    if (label.product_type.code !== data.productType) {
      return {
        outcome: "redirect",
        productType: label.product_type.code,
        labelId: data.labelId,
      }
    }
    return {
      outcome: "ok",
      label,
      isLinked: !!label.product_id,
    }
  })

async function readLabelDataWithCreate(
  client: Client,
  labelId: string,
): Promise<Record<string, unknown>> {
  let res = await LabelsService.readLabelData({
    client,
    path: { label_id: labelId },
    throwOnError: false,
  })
  if (!isAxiosError(res) && res.data !== undefined && res.data !== null) {
    return res.data as Record<string, unknown>
  }
  if (isAxiosError(res) && res.response?.status === StatusCodes.NOT_FOUND) {
    const created = await LabelsService.createLabelData({
      client,
      path: { label_id: labelId },
      body: {},
      throwOnError: false,
    })
    if (
      isAxiosError(created) &&
      created.response?.status !== StatusCodes.CONFLICT
    ) {
      throw new Error(
        messageFromAxiosApiError(created, "Failed to create label data"),
      )
    }
    res = await LabelsService.readLabelData({
      client,
      path: { label_id: labelId },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(
        messageFromAxiosApiError(res, "Failed to load label data"),
      )
    }
    return (res.data ?? {}) as Record<string, unknown>
  }
  if (isAxiosError(res)) {
    throw new Error(messageFromAxiosApiError(res, "Failed to load label data"))
  }
  const ok = res as { data?: Record<string, unknown> }
  return (ok.data ?? {}) as Record<string, unknown>
}

async function readFertilizerLabelDataWithCreate(
  client: Client,
  labelId: string,
): Promise<Record<string, unknown>> {
  let res = await LabelsService.readFertilizerLabelData({
    client,
    path: { label_id: labelId },
    throwOnError: false,
  })
  if (!isAxiosError(res) && res.data !== undefined && res.data !== null) {
    return res.data as Record<string, unknown>
  }
  if (isAxiosError(res) && res.response?.status === StatusCodes.NOT_FOUND) {
    const created = await LabelsService.createFertilizerLabelData({
      client,
      path: { label_id: labelId },
      body: {},
      throwOnError: false,
    })
    if (
      isAxiosError(created) &&
      created.response?.status !== StatusCodes.CONFLICT
    ) {
      throw new Error(
        messageFromAxiosApiError(created, "Failed to create fertilizer data"),
      )
    }
    res = await LabelsService.readFertilizerLabelData({
      client,
      path: { label_id: labelId },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(
        messageFromAxiosApiError(res, "Failed to load fertilizer data"),
      )
    }
    return (res.data ?? {}) as Record<string, unknown>
  }
  if (isAxiosError(res)) {
    throw new Error(
      messageFromAxiosApiError(res, "Failed to load fertilizer data"),
    )
  }
  const ok = res as { data?: Record<string, unknown> }
  return (ok.data ?? {}) as Record<string, unknown>
}

export type FetchAllLabelDataInput = { labelId: string; isFertilizer: boolean }

function assertFetchAllLabelData(data: unknown): FetchAllLabelDataInput {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  if (typeof o.isFertilizer !== "boolean") {
    throw new Error("Invalid isFertilizer")
  }
  return { labelId: o.labelId, isFertilizer: o.isFertilizer }
}

export type FetchAllLabelDataResult = {
  label: LabelDetail
  labelData: LabelData
  fertilizerData: FertilizerLabelData
  labelDataMeta: LabelDataFieldMetaResponse[]
  fertilizerDataMeta: FertilizerLabelDataMetaResponse[]
}

export const fetchAllLabelDataFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertFetchAllLabelData(data))
  .handler(async ({ data }): Promise<FetchAllLabelDataResult> => {
    const client = await requireAuthedApiClient()
    const labelRes = await LabelsService.readLabel({
      client,
      path: { label_id: data.labelId },
      throwOnError: false,
    })
    if (isAxiosError(labelRes) || !labelRes.data) {
      throw new Error(
        isAxiosError(labelRes)
          ? messageFromAxiosApiError(labelRes, "Failed to load label")
          : "Failed to load label",
      )
    }
    const label = labelRes.data
    const labelData = await readLabelDataWithCreate(client, data.labelId)
    const metaRes = await LabelsService.readLabelDataMeta({
      client,
      path: { label_id: data.labelId },
      throwOnError: false,
    })
    if (isAxiosError(metaRes)) {
      throw new Error(
        messageFromAxiosApiError(metaRes, "Failed to load label meta"),
      )
    }
    let fertilizerData: Record<string, unknown> = {}
    let fertilizerDataMeta: FertilizerLabelDataMetaResponse[] = []
    if (data.isFertilizer) {
      fertilizerData = await readFertilizerLabelDataWithCreate(
        client,
        data.labelId,
      )
      const fmetaRes = await LabelsService.readFertilizerLabelDataMeta({
        client,
        path: { label_id: data.labelId },
        throwOnError: false,
      })
      if (isAxiosError(fmetaRes)) {
        throw new Error(
          messageFromAxiosApiError(fmetaRes, "Failed to load fertilizer meta"),
        )
      }
      fertilizerDataMeta = fmetaRes.data ?? []
    }
    return {
      label,
      labelData: labelData as LabelData,
      fertilizerData: fertilizerData as FertilizerLabelData,
      labelDataMeta: metaRes.data ?? [],
      fertilizerDataMeta,
    }
  })

function assertReviewStatus(data: unknown): {
  labelId: string
  review_status: ReviewStatus
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  const rs = o.review_status
  if (rs !== "not_started" && rs !== "in_progress" && rs !== "completed") {
    throw new Error("Invalid review_status")
  }
  return { labelId: o.labelId, review_status: rs }
}

export const updateLabelReviewStatusFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertReviewStatus(data))
  .handler(async ({ data }): Promise<LabelDetail> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.updateLabelReviewStatus({
      client,
      path: { label_id: data.labelId },
      body: { review_status: data.review_status },
      throwOnError: false,
    })
    if (isAxiosError(res) || !res.data) {
      throw new Error(
        isAxiosError(res)
          ? messageFromAxiosApiError(res, "Failed to update review status")
          : "Failed to update review status",
      )
    }
    return res.data
  })

function assertExtractFields(data: unknown): {
  labelId: string
  field_names: string[] | null
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  if (o.field_names === null || o.field_names === undefined) {
    return { labelId: o.labelId, field_names: null }
  }
  if (!Array.isArray(o.field_names)) {
    throw new Error("Invalid field_names")
  }
  const field_names = o.field_names.filter(
    (x) => typeof x === "string",
  ) as string[]
  return { labelId: o.labelId, field_names }
}

export const extractFertilizerFieldsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertExtractFields(data))
  .handler(async ({ data }): Promise<ExtractFertilizerFieldsOutput | null> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.extractFertilizerFields({
      client,
      path: { label_id: data.labelId },
      body: data.field_names
        ? { field_names: data.field_names as never }
        : undefined,
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Extraction failed"))
    }
    return res.data ?? null
  })

function assertToggleReview(data: unknown): {
  labelId: string
  fieldName: string
  newNeedsReview: boolean
  isCommonField: boolean
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  if (typeof o.fieldName !== "string" || o.fieldName.length === 0) {
    throw new Error("Invalid fieldName")
  }
  if (typeof o.newNeedsReview !== "boolean") {
    throw new Error("Invalid newNeedsReview")
  }
  if (typeof o.isCommonField !== "boolean") {
    throw new Error("Invalid isCommonField")
  }
  return {
    labelId: o.labelId,
    fieldName: o.fieldName,
    newNeedsReview: o.newNeedsReview,
    isCommonField: o.isCommonField,
  }
}

export const toggleLabelFieldReviewFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertToggleReview(data))
  .handler(
    async ({
      data,
    }): Promise<
      LabelDataFieldMetaResponse | FertilizerLabelDataMetaResponse
    > => {
      const client = await requireAuthedApiClient()
      if (data.isCommonField) {
        const res = await LabelsService.updateLabelDataMeta({
          client,
          path: { label_id: data.labelId },
          body: {
            field_name: data.fieldName as never,
            needs_review: data.newNeedsReview,
          },
          throwOnError: false,
        })
        if (isAxiosError(res) || !res.data) {
          throw new Error(
            isAxiosError(res)
              ? messageFromAxiosApiError(res, "Failed to update meta")
              : "Failed to update meta",
          )
        }
        return res.data
      }
      const res = await LabelsService.updateFertilizerLabelDataMeta({
        client,
        path: { label_id: data.labelId },
        body: {
          field_name: data.fieldName as never,
          needs_review: data.newNeedsReview,
        },
        throwOnError: false,
      })
      if (isAxiosError(res) || !res.data) {
        throw new Error(
          isAxiosError(res)
            ? messageFromAxiosApiError(res, "Failed to update meta")
            : "Failed to update meta",
        )
      }
      return res.data
    },
  )

function assertLabelPatchBody(data: unknown): {
  labelId: string
  body: Record<string, unknown>
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  if (!o.patch || typeof o.patch !== "object") {
    throw new Error("Invalid patch")
  }
  return { labelId: o.labelId, body: o.patch as Record<string, unknown> }
}

export const updateLabelDataPartialFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertLabelPatchBody(data))
  .handler(async ({ data }): Promise<LabelData> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.updateLabelData({
      client,
      path: { label_id: data.labelId },
      body: data.body as never,
      throwOnError: false,
    })
    if (isAxiosError(res) || !res.data) {
      throw new Error(
        isAxiosError(res)
          ? messageFromAxiosApiError(res, "Failed to save")
          : "Failed to save",
      )
    }
    return res.data
  })

export const updateFertilizerLabelDataPartialFn = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => assertLabelPatchBody(data))
  .handler(async ({ data }): Promise<FertilizerLabelData> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.updateFertilizerLabelData({
      client,
      path: { label_id: data.labelId },
      body: data.body as never,
      throwOnError: false,
    })
    if (isAxiosError(res) || !res.data) {
      throw new Error(
        isAxiosError(res)
          ? messageFromAxiosApiError(res, "Failed to save")
          : "Failed to save",
      )
    }
    return res.data
  })

export const updateLabelRootFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertLabelPatchBody(data))
  .handler(async ({ data }): Promise<LabelDetail> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.updateLabel({
      client,
      path: { label_id: data.labelId },
      body: data.body as never,
      throwOnError: false,
    })
    if (isAxiosError(res) || !res.data) {
      throw new Error(
        isAxiosError(res)
          ? messageFromAxiosApiError(res, "Failed to update label")
          : "Failed to update label",
      )
    }
    return res.data
  })

function assertProductCreate(data: unknown): { body: Record<string, unknown> } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (!o.body || typeof o.body !== "object") {
    throw new Error("Invalid body")
  }
  return { body: o.body as Record<string, unknown> }
}

export const createProductEditorFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertProductCreate(data))
  .handler(async ({ data }): Promise<ProductPublic> => {
    const client = await requireAuthedApiClient()
    const res = await ProductsService.createProduct({
      client,
      body: data.body as never,
      throwOnError: false,
    })
    if (isAxiosError(res) || !res.data) {
      throw new Error(
        isAxiosError(res)
          ? messageFromAxiosApiError(res, "Failed to create product")
          : "Failed to create product",
      )
    }
    return res.data
  })

export const readLabelImagesFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertLabelId(data))
  .handler(async ({ data }): Promise<LabelImageDetail[]> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.readLabelImages({
      client,
      path: { label_id: data.labelId },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to load images"))
    }
    return res.data ?? []
  })

function assertImageDownload(data: unknown): {
  labelId: string
  imageId: string
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  if (typeof o.imageId !== "string" || o.imageId.length === 0) {
    throw new Error("Invalid imageId")
  }
  return { labelId: o.labelId, imageId: o.imageId }
}

export const getLabelImageDataFn = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => assertImageDownload(data))
  .handler(async ({ data }): Promise<string> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.getLabelImagePresignedDownloadUrl({
      client,
      path: { label_id: data.labelId, image_id: data.imageId },
      throwOnError: false,
    })
    if (isAxiosError(res) || !res.data?.presigned_url) {
      throw new Error(
        isAxiosError(res)
          ? messageFromAxiosApiError(res, "Failed to get download URL")
          : "Failed to get download URL",
      )
    }
    const imageRes = await axios.get<ArrayBuffer>(res.data.presigned_url, {
      responseType: "arraybuffer",
      timeout: SERVER_REQUEST_TIMEOUT_MS,
    })
    const contentType =
      (imageRes.headers["content-type"] as string) || "image/png"
    const base64 = Buffer.from(imageRes.data).toString("base64")
    return `data:${contentType};base64,${base64}`
  })

export const deleteLabelImageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertImageDownload(data))
  .handler(async ({ data }): Promise<void> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.deleteLabelImage({
      client,
      path: { label_id: data.labelId, image_id: data.imageId },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to delete image"))
    }
  })

function assertProductId(data: unknown): { productId: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.productId !== "string" || o.productId.length === 0) {
    throw new Error("Invalid productId")
  }
  return { productId: o.productId }
}

export const readProductByIdEditorFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertProductId(data))
  .handler(async ({ data }): Promise<ProductPublic | null> => {
    const client = await requireAuthedApiClient()
    const res = await ProductsService.readProductById({
      client,
      path: { product_id: data.productId },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      if (
        res.response?.status === StatusCodes.NOT_FOUND ||
        res.response?.status === StatusCodes.UNPROCESSABLE_ENTITY
      ) {
        return null
      }
      throw new Error(messageFromAxiosApiError(res, "Failed to load product"))
    }
    return res.data ?? null
  })

export type SearchProductsEditorInput = {
  registration_number?: string
  brand_name_en?: string
  brand_name_fr?: string
  name_en?: string
  name_fr?: string
}

function assertSearchProducts(data: unknown): SearchProductsEditorInput {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  const out: SearchProductsEditorInput = {}
  if (typeof o.registration_number === "string" && o.registration_number) {
    out.registration_number = o.registration_number
  }
  if (typeof o.brand_name_en === "string" && o.brand_name_en) {
    out.brand_name_en = o.brand_name_en
  }
  if (typeof o.brand_name_fr === "string" && o.brand_name_fr) {
    out.brand_name_fr = o.brand_name_fr
  }
  if (typeof o.name_en === "string" && o.name_en) {
    out.name_en = o.name_en
  }
  if (typeof o.name_fr === "string" && o.name_fr) {
    out.name_fr = o.name_fr
  }
  return out
}

export const searchProductsEditorFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertSearchProducts(data))
  .handler(async ({ data }): Promise<LimitOffsetPageProductPublic> => {
    const client = await requireAuthedApiClient()
    const res = await ProductsService.readProducts({
      client,
      query: data as never,
      throwOnError: false,
    })
    if (isAxiosError(res) || !res.data) {
      throw new Error(
        isAxiosError(res)
          ? messageFromAxiosApiError(res, "Product search failed")
          : "Product search failed",
      )
    }
    return res.data
  })
