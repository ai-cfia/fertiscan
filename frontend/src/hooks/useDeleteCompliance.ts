// ============================== Delete compliance ==============================

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { useTranslation } from "react-i18next"
import type { NonComplianceDataItemPublic } from "#/api/types.gen"
import { useSnackbar } from "#/components/SnackbarProvider"
import { deleteComplianceItemFn } from "#/server/label-compliance"
import { getErrorMessage } from "#/utils/labelDataErrors"

const EVALUATION_QUERY_KEY = "compliance-eval" as const

export function useDeleteCompliance(
  labelId: string,
  complianceItems: NonComplianceDataItemPublic[],
) {
  const queryClient = useQueryClient()
  const { t } = useTranslation(["labels", "errors"])
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const deleteFn = useServerFn(deleteComplianceItemFn)
  const mutation = useMutation({
    mutationFn: (requirementId: string) =>
      deleteFn({ data: { labelId, requirementId } }),
    onMutate: async (requirementId) => {
      await queryClient.cancelQueries({
        queryKey: ["complianceItems", labelId],
      })
      const prev = queryClient.getQueryData<NonComplianceDataItemPublic[]>([
        "complianceItems",
        labelId,
      ])
      queryClient.setQueryData(
        ["complianceItems", labelId],
        (old: NonComplianceDataItemPublic[] | undefined) =>
          (old ?? []).filter((i) => i.requirement_id !== requirementId),
      )
      queryClient.removeQueries({
        queryKey: [EVALUATION_QUERY_KEY, labelId, requirementId],
      })
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complianceItems", labelId] })
      showSuccessToast(t("data.complianceCleared", { ns: "labels" }))
    },
    onError: (error, _requirementId, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["complianceItems", labelId], context.prev)
      }
      showErrorToast(getErrorMessage(error, t))
    },
  })
  const clearRequirement = (requirementId: string) => {
    const hasSaved = complianceItems.some(
      (i) => i.requirement_id === requirementId,
    )
    queryClient.removeQueries({
      queryKey: [EVALUATION_QUERY_KEY, labelId, requirementId],
    })
    if (hasSaved) {
      mutation.mutate(requirementId)
    }
  }
  return {
    clearRequirement,
    isDeleting: mutation.isPending,
    deletingRequirementId:
      mutation.isPending && mutation.variables ? mutation.variables : null,
  }
}
