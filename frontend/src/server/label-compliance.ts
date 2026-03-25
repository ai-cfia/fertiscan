// ============================== Label compliance (server) ==============================
// --- Session bearer API for compliance page (browser has no API token) ---

import { createServerFn } from "@tanstack/react-start"
import { isAxiosError } from "axios"
import { StatusCodes } from "http-status-codes"
import { LabelsService, LegislationsService, RequirementsService } from "#/api"
import type {
  ComplianceResult,
  ComplianceStatus,
  FertilizerLabelData,
  LabelData,
  LegislationPublic,
  NonComplianceDataItemPayload,
  NonComplianceDataItemPublic,
  RequirementPublic,
  UpdateNonComplianceDataItemPayload,
} from "#/api/types.gen"
import { requireAuthedApiClient } from "#/server/api-client"
import { messageFromAxiosApiError } from "#/server/api-error-message"

function assertProductType(data: unknown): { productType: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.productType !== "string" || o.productType.length === 0) {
    throw new Error("Invalid productType")
  }
  return { productType: o.productType }
}

function assertLegislationIds(data: unknown): { legislationIds: string[] } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  const ids = o.legislationIds
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string")) {
    throw new Error("Invalid legislationIds")
  }
  return { legislationIds: ids as string[] }
}

function assertLabelIdOnly(data: unknown): { labelId: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  return { labelId: o.labelId }
}

function assertEvaluate(data: unknown): {
  labelId: string
  requirementId: string
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  if (typeof o.requirementId !== "string" || o.requirementId.length === 0) {
    throw new Error("Invalid requirementId")
  }
  return { labelId: o.labelId, requirementId: o.requirementId }
}

export const readLegislationsComplianceFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertProductType(data))
  .handler(async ({ data }): Promise<LegislationPublic[]> => {
    const client = await requireAuthedApiClient()
    const res = await LegislationsService.readLegislations({
      client,
      query: { product_type: data.productType },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(
        messageFromAxiosApiError(res, "Failed to load legislations"),
      )
    }
    return res.data ?? []
  })

export const readRequirementsForLegislationsFn = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => assertLegislationIds(data))
  .handler(async ({ data }): Promise<RequirementPublic[]> => {
    if (data.legislationIds.length === 0) {
      return []
    }
    const client = await requireAuthedApiClient()
    const limit = 100
    const all: RequirementPublic[] = []
    let offset = 0
    let total = Infinity
    while (offset < total) {
      const res = await RequirementsService.readRequirements({
        client,
        query: {
          legislation_ids: data.legislationIds,
          limit,
          offset,
        } as never,
        throwOnError: false,
      })
      if (isAxiosError(res)) {
        throw new Error(
          messageFromAxiosApiError(res, "Failed to load requirements"),
        )
      }
      const page = res.data
      if (!page) {
        break
      }
      all.push(...page.items)
      total = page.total
      offset += page.items.length
      if (page.items.length < limit) {
        break
      }
    }
    return all
  })

export const readAllCompliancesFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertLabelIdOnly(data))
  .handler(async ({ data }): Promise<NonComplianceDataItemPublic[]> => {
    const client = await requireAuthedApiClient()
    const limit = 100
    const all: NonComplianceDataItemPublic[] = []
    let offset = 0
    let total = Infinity
    while (offset < total) {
      const res = await LabelsService.readsCompliances({
        client,
        path: { label_id: data.labelId },
        query: { limit, offset },
        throwOnError: false,
      })
      if (isAxiosError(res)) {
        throw new Error(
          messageFromAxiosApiError(res, "Failed to load compliance items"),
        )
      }
      const page = res.data
      if (!page) {
        break
      }
      all.push(...page.items)
      total = page.total
      offset += page.items.length
      if (page.items.length < limit) {
        break
      }
    }
    return all
  })

export type ReadLabelDataComplianceResult =
  | { outcome: "ok"; data: LabelData }
  | { outcome: "not_found" }

export const readLabelDataComplianceFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertLabelIdOnly(data))
  .handler(async ({ data }): Promise<ReadLabelDataComplianceResult> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.readLabelData({
      client,
      path: { label_id: data.labelId },
      throwOnError: false,
    })
    if (isAxiosError(res) && res.response?.status === StatusCodes.NOT_FOUND) {
      return { outcome: "not_found" }
    }
    if (isAxiosError(res)) {
      throw new Error(
        messageFromAxiosApiError(res, "Failed to load label data"),
      )
    }
    if (res.data === undefined || res.data === null) {
      return { outcome: "not_found" }
    }
    return { outcome: "ok", data: res.data }
  })

export type ReadFertilizerLabelDataComplianceResult =
  | { outcome: "ok"; data: FertilizerLabelData }
  | { outcome: "not_found" }

export const readFertilizerLabelDataComplianceFn = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => assertLabelIdOnly(data))
  .handler(
    async ({ data }): Promise<ReadFertilizerLabelDataComplianceResult> => {
      const client = await requireAuthedApiClient()
      const res = await LabelsService.readFertilizerLabelData({
        client,
        path: { label_id: data.labelId },
        throwOnError: false,
      })
      if (isAxiosError(res) && res.response?.status === StatusCodes.NOT_FOUND) {
        return { outcome: "not_found" }
      }
      if (isAxiosError(res)) {
        throw new Error(
          messageFromAxiosApiError(res, "Failed to load fertilizer data"),
        )
      }
      if (res.data === undefined || res.data === null) {
        return { outcome: "not_found" }
      }
      return { outcome: "ok", data: res.data }
    },
  )

export const evaluateNonComplianceFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertEvaluate(data))
  .handler(async ({ data }): Promise<ComplianceResult> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.evaluateNonCompliance({
      client,
      path: {
        label_id: data.labelId,
        requirement_id: data.requirementId,
      },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(
        messageFromAxiosApiError(res, "Compliance evaluation failed"),
      )
    }
    const result = res.data
    if (!result) {
      throw new Error("No evaluation result returned")
    }
    return result
  })

function assertSaveCompliance(data: unknown): {
  labelId: string
  requirementId: string
  language: "en" | "fr"
  status: string
  description: string
  existing: NonComplianceDataItemPublic | null
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.labelId !== "string" || o.labelId.length === 0) {
    throw new Error("Invalid labelId")
  }
  if (typeof o.requirementId !== "string" || o.requirementId.length === 0) {
    throw new Error("Invalid requirementId")
  }
  if (o.language !== "en" && o.language !== "fr") {
    throw new Error("Invalid language")
  }
  if (typeof o.status !== "string") {
    throw new Error("Invalid status")
  }
  if (typeof o.description !== "string") {
    throw new Error("Invalid description")
  }
  const ex = o.existing
  const existing =
    ex === null || ex === undefined ? null : (ex as NonComplianceDataItemPublic)
  return {
    labelId: o.labelId,
    requirementId: o.requirementId,
    language: o.language,
    status: o.status,
    description: o.description,
    existing,
  }
}

export const saveComplianceItemFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertSaveCompliance(data))
  .handler(async ({ data }): Promise<void> => {
    const client = await requireAuthedApiClient()
    const { status, description } = data
    const statusVal = (status || "inconclusive") as ComplianceStatus
    const existing = data.existing
    if (existing) {
      const body: UpdateNonComplianceDataItemPayload = {
        status: statusVal,
      }
      if (data.language === "en") {
        body.description_en = description || null
        body.description_fr = existing.description_fr ?? null
      } else {
        body.description_fr = description || null
        body.description_en = existing.description_en ?? null
      }
      const res = await LabelsService.updateCompliance({
        client,
        path: {
          label_id: data.labelId,
          requirement_id: data.requirementId,
        },
        body,
        throwOnError: false,
      })
      if (isAxiosError(res)) {
        throw new Error(
          messageFromAxiosApiError(res, "Failed to save compliance"),
        )
      }
      return
    }
    const body: NonComplianceDataItemPayload = {
      requirement_id: data.requirementId,
      status: statusVal,
      ...(data.language === "en"
        ? { description_en: description || null }
        : { description_fr: description || null }),
    }
    const res = await LabelsService.createCompliance({
      client,
      path: { label_id: data.labelId },
      body,
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(
        messageFromAxiosApiError(res, "Failed to save compliance"),
      )
    }
  })

export const deleteComplianceItemFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertEvaluate(data))
  .handler(async ({ data }): Promise<void> => {
    const client = await requireAuthedApiClient()
    const res = await LabelsService.deleteCompliance({
      client,
      path: {
        label_id: data.labelId,
        requirement_id: data.requirementId,
      },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(
        messageFromAxiosApiError(res, "Failed to delete compliance"),
      )
    }
  })
