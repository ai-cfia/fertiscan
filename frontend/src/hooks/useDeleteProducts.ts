// ============================== Delete products ==============================

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import pLimit from "p-limit"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSnackbar } from "#/components/SnackbarProvider"
import { deleteProductFn } from "#/server/products-list"

const DELETE_CONCURRENCY_LIMIT = 2

export function useDeleteProducts() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("products")
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const deleteFn = useServerFn(deleteProductFn)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const mutation = useMutation({
    mutationFn: (productId: string) => deleteFn({ data: { productId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      showSuccessToast(t("products.rowActions.deleteSuccess"))
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
      const limit = pLimit(DELETE_CONCURRENCY_LIMIT)
      const results = await Promise.allSettled(
        ids.map((id) => limit(() => deleteFn({ data: { productId: id } }))),
      )
      const ok = results.filter((r) => r.status === "fulfilled").length
      const failed = results.length - ok
      queryClient.invalidateQueries({ queryKey: ["products"] })
      if (failed === 0) {
        showSuccessToast(
          t("products.bulkActions.deleteSuccess", { count: ok }),
        )
      } else if (ok === 0) {
        showErrorToast(t("products.bulkActions.deleteFailed"))
      } else {
        showErrorToast(
          t("products.bulkActions.deletePartial", {
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
