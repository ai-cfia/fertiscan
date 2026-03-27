// ============================== Label upload (server) ==============================
// --- Authenticated OpenAPI calls for new-label flow (browser has no API bearer) ---

import { createServerFn } from "@tanstack/react-start"
import axios, { isAxiosError } from "axios"
import { LabelsService } from "#/api"
import type { LabelCreated, LabelImageDetail } from "#/api/types.gen"
import { requireAuthedApiClient } from "#/server/api-client"
import { messageFromAxiosApiError } from "#/server/api-error-message"

const IMAGE_CT = ["image/png", "image/jpeg", "image/webp"] as const
type ImageCt = (typeof IMAGE_CT)[number]

function assertCreateLabelBody(data: unknown): { productType: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.productType !== "string" || o.productType.length === 0) {
    throw new Error("Invalid productType")
  }
  return { productType: o.productType }
}

function assertUploadImageBody(data: unknown): {
  labelId: string
  displayFilename: string
  contentType: ImageCt
  sequenceOrder: number
  fileBase64: string
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  if (typeof o.displayFilename !== "string" || o.displayFilename.length === 0) {
    throw new Error("Invalid displayFilename")
  }
  if (
    typeof o.contentType !== "string" ||
    !IMAGE_CT.includes(o.contentType as ImageCt)
  ) {
    throw new Error("Invalid contentType")
  }
  if (
    typeof o.sequenceOrder !== "number" ||
    !Number.isFinite(o.sequenceOrder) ||
    o.sequenceOrder < 1
  ) {
    throw new Error("Invalid sequenceOrder")
  }
  if (typeof o.fileBase64 !== "string" || o.fileBase64.length === 0) {
    throw new Error("Invalid file data")
  }
  return {
    labelId: o.labelId,
    displayFilename: o.displayFilename,
    contentType: o.contentType as ImageCt,
    sequenceOrder: o.sequenceOrder,
    fileBase64: o.fileBase64,
  }
}
const MAX_IMAGE_BYTES = 25 * 1024 * 1024

export const createLabelForUploadFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertCreateLabelBody(data))
  .handler(async ({ data }): Promise<LabelCreated> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.createLabel({
      client,
      body: { product_type: data.productType },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to create label"))
    }
    if (res.status !== 201 || !res.data?.id) {
      throw new Error("Failed to create label")
    }
    return res.data
  })

export const uploadLabelImageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertUploadImageBody(data))
  .handler(async ({ data }): Promise<LabelImageDetail> => {
    const client = await requireAuthedApiClient()
    const fileBuffer = Buffer.from(data.fileBase64, "base64")
    if (fileBuffer.length === 0) {
      throw new Error("Empty file")
    }
    if (fileBuffer.length > MAX_IMAGE_BYTES) {
      throw new Error("File too large")
    }
    const createRes = await LabelsService.createLabelImage({
      client,
      path: { label_id: data.labelId },
      body: {
        display_filename: data.displayFilename,
        content_type: data.contentType,
        sequence_order: data.sequenceOrder,
      },
      throwOnError: false,
    })
    if (isAxiosError(createRes)) {
      throw new Error(
        messageFromAxiosApiError(createRes, "Failed to create label image"),
      )
    }
    if (createRes.status !== 201 || !createRes.data) {
      throw new Error("Failed to create label image")
    }
    const imageDetail = createRes.data
    const presignedRes = await LabelsService.getLabelImagePresignedUploadUrl({
      client,
      path: { label_id: data.labelId, image_id: imageDetail.id },
      query: { content_type: data.contentType },
      throwOnError: false,
    })
    if (isAxiosError(presignedRes)) {
      throw new Error(
        messageFromAxiosApiError(presignedRes, "Failed to get upload URL"),
      )
    }
    if (presignedRes.status !== 200 || !presignedRes.data?.url) {
      throw new Error("Failed to get upload URL")
    }
    try {
      await axios.put(presignedRes.data.url, fileBuffer, {
        headers: { "Content-Type": data.contentType },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      })
    } catch (e) {
      if (isAxiosError(e)) {
        throw new Error(
          messageFromAxiosApiError(e, "Failed to upload file to storage"),
        )
      }
      throw e
    }
    const completeRes = await LabelsService.completeLabelImageUpload({
      client,
      path: { label_id: data.labelId },
      body: { storage_file_path: imageDetail.file_path },
      throwOnError: false,
    })
    if (isAxiosError(completeRes)) {
      throw new Error(
        messageFromAxiosApiError(completeRes, "Failed to complete upload"),
      )
    }
    if (completeRes.status !== 200 || !completeRes.data) {
      throw new Error("Failed to complete upload")
    }
    return completeRes.data
  })
