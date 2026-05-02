// ============================== Delete labels ==============================

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSnackbar } from "#/components/SnackbarProvider"
import { deleteLabelFn } from "#/server/labels-list"

export function useDeleteLabels() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("labels")
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const deleteFn = useServerFn(deleteLabelFn)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const mutation = useMutation({
    mutationFn: (labelId: string) => deleteFn({ data: { labelId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] })
      showSuccessToast(t("labels.rowActions.deleteSuccess"))
    },
    onError: (error: Error) => {
      showErrorToast(error.message)
    },
  })
  const deleteOne = async (id: string): Promise<void> => {
    try {
      await mutation.mutateAsync(id)
    } catch {
      // surfaced via onError toast
    }
  }
  const deleteMany = async (
    ids: readonly string[],
  ): Promise<{ ok: number; failed: number }> => {
    if (ids.length === 0) {
      return { ok: 0, failed: 0 }
    }
    setIsBulkDeleting(true)
    try {
      const results = await Promise.allSettled(
        ids.map((id) => deleteFn({ data: { labelId: id } })),
      )
      const ok = results.filter((r) => r.status === "fulfilled").length
      const failed = results.length - ok
      queryClient.invalidateQueries({ queryKey: ["labels"] })
      if (failed === 0) {
        showSuccessToast(t("labels.bulkActions.deleteSuccess", { count: ok }))
      } else if (ok === 0) {
        showErrorToast(t("labels.bulkActions.deleteFailed"))
      } else {
        showErrorToast(
          t("labels.bulkActions.deletePartial", {
            ok: String(ok),
            failed: String(failed),
          }),
        )
      }
      return { ok, failed }
    } finally {
      setIsBulkDeleting(false)
    }
  }
  return {
    deleteOne,
    deleteMany,
    isDeletingId:
      mutation.isPending && typeof mutation.variables === "string"
        ? mutation.variables
        : null,
    isBulkDeleting,
  }
}
