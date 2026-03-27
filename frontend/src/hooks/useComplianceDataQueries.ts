// ============================== Compliance data (client) ==============================
// --- Server fns: session bearer is httpOnly ---

import { useQuery } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { StatusCodes } from "http-status-codes"
import type { RequirementPublic } from "#/api/types.gen"
import {
  readAllCompliancesFn,
  readFertilizerLabelDataComplianceFn,
  readLabelDataComplianceFn,
  readLegislationsComplianceFn,
  readRequirementsForLegislationsFn,
} from "#/server/label-compliance"
import { isAxiosErrorWithStatus } from "#/utils/labelDataErrors"

export function useComplianceDataQueries(labelId: string, productType: string) {
  const isFertilizer = productType === "fertilizer"
  const readLegislations = useServerFn(readLegislationsComplianceFn)
  const readRequirements = useServerFn(readRequirementsForLegislationsFn)
  const readCompliances = useServerFn(readAllCompliancesFn)
  const readLabelData = useServerFn(readLabelDataComplianceFn)
  const readFertilizerLabelData = useServerFn(
    readFertilizerLabelDataComplianceFn,
  )
  const legislationsQuery = useQuery({
    queryKey: ["legislations", productType],
    queryFn: async () => {
      return readLegislations({ data: { productType } })
    },
  })
  const legislationIds = legislationsQuery.data?.map((l) => l.id) ?? []
  const requirementsQuery = useQuery({
    queryKey: ["requirements", productType, legislationIds],
    queryFn: async (): Promise<RequirementPublic[]> => {
      return readRequirements({ data: { legislationIds } })
    },
    enabled: legislationsQuery.isSuccess,
  })
  const complianceItemsQuery = useQuery({
    queryKey: ["complianceItems", labelId],
    queryFn: async () => {
      return readCompliances({ data: { labelId } })
    },
  })
  const labelDataQuery = useQuery({
    queryKey: ["labelData", labelId],
    queryFn: async () => {
      return readLabelData({ data: { labelId } })
    },
    retry: false,
    throwOnError: false,
  })
  const fertilizerLabelDataQuery = useQuery({
    queryKey: ["fertilizerLabelData", labelId],
    queryFn: async () => {
      return readFertilizerLabelData({ data: { labelId } })
    },
    enabled: isFertilizer,
    retry: false,
    throwOnError: false,
  })
  const hasLabelData =
    labelDataQuery.isSuccess && labelDataQuery.data?.outcome === "ok"
  const hasFertilizerData =
    !isFertilizer ||
    (fertilizerLabelDataQuery.isSuccess &&
      fertilizerLabelDataQuery.data?.outcome === "ok")
  const meetsPrerequisite = hasLabelData && hasFertilizerData
  const isLoading =
    legislationsQuery.isLoading ||
    requirementsQuery.isLoading ||
    complianceItemsQuery.isLoading ||
    labelDataQuery.isLoading ||
    (isFertilizer && fertilizerLabelDataQuery.isLoading)
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
  const labelData =
    labelDataQuery.data?.outcome === "ok" ? labelDataQuery.data.data : undefined
  const fertilizerData =
    fertilizerLabelDataQuery.data?.outcome === "ok"
      ? fertilizerLabelDataQuery.data.data
      : undefined
  return {
    legislations: legislationsQuery.data ?? [],
    requirements: requirementsQuery.data ?? [],
    complianceItems: complianceItemsQuery.data ?? [],
    labelData,
    fertilizerData,
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
