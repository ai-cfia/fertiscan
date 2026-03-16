import { useQueries, useQueryClient } from "@tanstack/react-query"
import pLimit from "p-limit"
import { useCallback, useMemo } from "react"
import type { ComplianceResult } from "@/api"
import { LabelsService } from "@/api"

const EVALUATION_QUERY_KEY = "compliance-eval" as const
const EVALUATION_CONCURRENCY_LIMIT = 1

// ============================== Hook ==============================
export function useEvaluateCompliance(
  labelId: string,
  requirementIds: string[],
) {
  const queryClient = useQueryClient()
  const queries = useQueries({
    queries: requirementIds.map((requirementId) => ({
      queryKey: [EVALUATION_QUERY_KEY, labelId, requirementId] as const,
      queryFn: async ({ signal }) => {
        const response = await LabelsService.evaluateNonCompliance({
          path: { label_id: labelId, requirement_id: requirementId },
          signal,
        })
        const result = response.data
        if (!result) throw new Error("No evaluation result returned")
        return result as ComplianceResult
      },
      enabled: false,
    })),
  })
  const evaluate = useCallback(
    (requirementId: string) => {
      void queryClient.fetchQuery({
        queryKey: [EVALUATION_QUERY_KEY, labelId, requirementId],
      })
    },
    [queryClient, labelId],
  )
  const evaluateMany = useCallback(
    (ids: string[]) => {
      const limit = pLimit(EVALUATION_CONCURRENCY_LIMIT)
      ids.forEach((id) => {
        limit(() =>
          queryClient.fetchQuery({
            queryKey: [EVALUATION_QUERY_KEY, labelId, id],
          }),
        )
      })
    },
    [queryClient, labelId],
  )
  const cancel = useCallback(() => {
    void queryClient.cancelQueries({
      queryKey: [EVALUATION_QUERY_KEY, labelId],
    })
  }, [queryClient, labelId])
  const cancelRequirement = useCallback(
    (requirementId: string) => {
      void queryClient.cancelQueries({
        queryKey: [EVALUATION_QUERY_KEY, labelId, requirementId],
      })
    },
    [queryClient, labelId],
  )
  const evaluationResults = useMemo(() => {
    const map: Record<string, ComplianceResult> = {}
    queries.forEach((q, i) => {
      if (q.data && requirementIds[i]) {
        map[requirementIds[i]] = q.data
      }
    })
    return map
  }, [queries, requirementIds])
  const isEvaluating = useCallback(
    (requirementId: string) => {
      const idx = requirementIds.indexOf(requirementId)
      return idx >= 0 && queries[idx]?.isFetching === true
    },
    [requirementIds, queries],
  )
  const isEvaluatingAny = queries.some((q) => q.isFetching)
  const getEvaluationError = useCallback(
    (requirementId: string) => {
      const idx = requirementIds.indexOf(requirementId)
      const q = idx >= 0 ? queries[idx] : undefined
      return q?.isError ? q.error : null
    },
    [requirementIds, queries],
  )
  return {
    evaluate,
    evaluateMany,
    cancel,
    cancelRequirement,
    isEvaluating,
    isEvaluatingAny,
    evaluationResults,
    getEvaluationError,
  }
}
