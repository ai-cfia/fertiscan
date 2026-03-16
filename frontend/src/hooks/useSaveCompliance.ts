import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  type ComplianceStatus,
  LabelsService,
  type NonComplianceDataItemPublic,
} from "@/api"
import { useSnackbar } from "@/components/SnackbarProvider"
import { getErrorMessage } from "@/utils/labelDataErrors"

// ============================== Types ==============================
export interface SaveCompliancePayload {
  status: ComplianceStatus | ""
  description: string
}

// ============================== Hook ==============================
export function useSaveCompliance(
  labelId: string,
  complianceItems: NonComplianceDataItemPublic[],
  language: "en" | "fr",
) {
  const queryClient = useQueryClient()
  const { t } = useTranslation(["labels", "errors"])
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const mutation = useMutation({
    mutationFn: async ({
      requirementId,
      payload,
    }: {
      requirementId: string
      payload: SaveCompliancePayload
    }) => {
      const existing = complianceItems.find(
        (i) => i.requirement_id === requirementId,
      )
      const { status, description } = payload
      const statusVal = status || "inconclusive"
      if (existing) {
        const body: {
          status?: ComplianceStatus
          description_en?: string | null
          description_fr?: string | null
        } = { status: statusVal as ComplianceStatus }
        if (language === "en") {
          body.description_en = description || null
          body.description_fr = existing.description_fr ?? null
        } else {
          body.description_fr = description || null
          body.description_en = existing.description_en ?? null
        }
        return LabelsService.updateCompliance({
          path: { label_id: labelId, requirement_id: requirementId },
          body,
        })
      }
      const body = {
        requirement_id: requirementId,
        status: statusVal as ComplianceStatus,
        ...(language === "en"
          ? { description_en: description || null }
          : { description_fr: description || null }),
      }
      return LabelsService.createCompliance({
        path: { label_id: labelId },
        body,
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
