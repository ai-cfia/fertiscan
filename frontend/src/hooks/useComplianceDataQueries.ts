import { useQuery } from "@tanstack/react-query"
import { StatusCodes } from "http-status-codes"
import {
  LabelsService,
  LegislationsService,
  type NonComplianceDataItemPublic,
  type RequirementPublic,
  RequirementsService,
} from "@/api"
import { isAxiosErrorWithStatus } from "@/utils/labelDataErrors"

// ============================== Hook ==============================
export function useComplianceDataQueries(labelId: string, productType: string) {
  const isFertilizer = productType === "fertilizer"
  // ------------------------------ Legislations ------------------------------
  const legislationsQuery = useQuery({
    queryKey: ["legislations", productType],
    queryFn: async () => {
      const response = await LegislationsService.readLegislations({
        query: { product_type: productType },
      })
      return response.data
    },
  })
  // ------------------------------ Requirements ------------------------------
  const legislationIds = legislationsQuery.data?.map((l) => l.id) ?? []
  const requirementsQuery = useQuery({
    queryKey: ["requirements", productType, legislationIds],
    queryFn: async (): Promise<RequirementPublic[]> => {
      if (legislationIds.length === 0) return []
      const limit = 100
      const all: RequirementPublic[] = []
      let offset = 0
      let total = Infinity
      while (offset < total) {
        const response = await RequirementsService.readRequirements({
          query: {
            legislation_ids: legislationIds,
            limit,
            offset,
          } as any,
        })
        const data = response.data
        if (!data) break
        all.push(...data.items)
        total = data.total
        offset += data.items.length
        if (data.items.length < limit) break
      }
      return all
    },
    enabled: legislationsQuery.isSuccess,
  })
  // ------------------------------ Compliance items ------------------------------
  const complianceItemsQuery = useQuery({
    queryKey: ["complianceItems", labelId],
    queryFn: async (): Promise<NonComplianceDataItemPublic[]> => {
      const limit = 100
      const all: NonComplianceDataItemPublic[] = []
      let offset = 0
      let total = Infinity
      while (offset < total) {
        const response = await LabelsService.readsCompliances({
          path: { label_id: labelId },
          query: { limit, offset },
        })
        const data = response.data
        if (!data) break
        all.push(...data.items)
        total = data.total
        offset += data.items.length
        if (data.items.length < limit) break
      }
      return all
    },
  })
  // ------------------------------ Label data (prerequisite) ------------------------------
  const labelDataQuery = useQuery({
    queryKey: ["labelData", labelId],
    queryFn: async () => {
      const response = await LabelsService.readLabelData({
        path: { label_id: labelId },
      })
      return response.data
    },
    retry: false,
    throwOnError: false,
  })
  // ------------------------------ Fertilizer label data ------------------------------
  const fertilizerLabelDataQuery = useQuery({
    queryKey: ["fertilizerLabelData", labelId],
    queryFn: async () => {
      const response = await LabelsService.readFertilizerLabelData({
        path: { label_id: labelId },
      })
      return response.data
    },
    enabled: isFertilizer,
    retry: false,
    throwOnError: false,
  })
  // ------------------------------ Prerequisite check ------------------------------
  const hasLabelData =
    labelDataQuery.isSuccess && labelDataQuery.data !== undefined
  const hasFertilizerData =
    !isFertilizer ||
    (fertilizerLabelDataQuery.isSuccess &&
      fertilizerLabelDataQuery.data !== undefined)
  const meetsPrerequisite = hasLabelData && hasFertilizerData
  // ------------------------------ Loading aggregate ------------------------------
  const isLoading =
    legislationsQuery.isLoading ||
    requirementsQuery.isLoading ||
    complianceItemsQuery.isLoading ||
    labelDataQuery.isLoading ||
    (isFertilizer && fertilizerLabelDataQuery.isLoading)
  // ------------------------------ Error handling ------------------------------
  const labelDataIsFatalError =
    labelDataQuery.isError &&
    !isAxiosErrorWithStatus(labelDataQuery.error, StatusCodes.NOT_FOUND)
  const fertilizerDataIsFatalError =
    isFertilizer &&
    fertilizerLabelDataQuery.isError &&
    !isAxiosErrorWithStatus(
      fertilizerLabelDataQuery.error,
      StatusCodes.NOT_FOUND,
    )
  const hasQueryError =
    legislationsQuery.isError ||
    requirementsQuery.isError ||
    complianceItemsQuery.isError ||
    labelDataIsFatalError ||
    fertilizerDataIsFatalError
  const queryError =
    (legislationsQuery.isError && legislationsQuery.error) ||
    (requirementsQuery.isError && requirementsQuery.error) ||
    (complianceItemsQuery.isError && complianceItemsQuery.error) ||
    (labelDataIsFatalError && labelDataQuery.error) ||
    (fertilizerDataIsFatalError && fertilizerLabelDataQuery.error) ||
    null
  return {
    requirements: requirementsQuery.data ?? [],
    complianceItems: complianceItemsQuery.data ?? [],
    labelData: labelDataQuery.data,
    fertilizerData: fertilizerLabelDataQuery.data,
    meetsPrerequisite,
    isLoading,
    isError: hasQueryError,
    error: queryError,
    legislationsQuery,
    requirementsQuery,
    complianceItemsQuery,
    labelDataQuery,
    fertilizerLabelDataQuery,
  }
}
