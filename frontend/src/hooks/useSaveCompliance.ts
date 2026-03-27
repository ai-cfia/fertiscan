// ============================== Save compliance ==============================

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { useTranslation } from "react-i18next"
import type {
  ComplianceStatus,
  NonComplianceDataItemPublic,
} from "#/api/types.gen"
import { useSnackbar } from "#/components/SnackbarProvider"
import { saveComplianceItemFn } from "#/server/label-compliance"
import { getErrorMessage } from "#/utils/labelDataErrors"

export interface SaveCompliancePayload {
  status: ComplianceStatus | ""
  description: string
}

export function useSaveCompliance(
  labelId: string,
  complianceItems: NonComplianceDataItemPublic[],
  language: "en" | "fr",
) {
  const queryClient = useQueryClient()
  const { t } = useTranslation(["labels", "errors"])
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const saveFn = useServerFn(saveComplianceItemFn)
  const mutation = useMutation({
    mutationFn: async ({
      requirementId,
      payload,
    }: {
      requirementId: string
      payload: SaveCompliancePayload
    }) => {
      const existing =
        complianceItems.find((i) => i.requirement_id === requirementId) ?? null
      await saveFn({
        data: {
          labelId,
          requirementId,
          language,
          status: payload.status || "",
          description: payload.description || "",
          existing,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complianceItems", labelId] })
      showSuccessToast(t("data.saved", { ns: "labels" }))
    },
    onError: (error) => {
      showErrorToast(getErrorMessage(error, t))
    },
  })
  return {
    saveRequirement: mutation.mutate,
    saveRequirementAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
  }
}
