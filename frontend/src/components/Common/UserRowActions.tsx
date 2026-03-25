// ============================== User row actions (admin grid) ==============================

import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@mui/material"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { UserPublic } from "#/api"
import EditUserDialog from "#/components/Common/EditUserDialog"
import { useSnackbar } from "#/components/SnackbarProvider"
import { deleteUserByIdAdminFn } from "#/server/admin-users"

interface UserRowActionsProps {
  user: UserPublic
  onDelete?: () => void
  onEditSuccess?: () => void
  deleteDisabled?: boolean
}

export default function UserRowActions({
  user,
  onDelete,
  onEditSuccess,
  deleteDisabled = false,
}: UserRowActionsProps) {
  const { t } = useTranslation("common")
  const { showErrorToast, showSuccessToast } = useSnackbar()
  const queryClient = useQueryClient()
  const runDeleteUser = useServerFn(deleteUserByIdAdminFn)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const deleteMutation = useMutation({
    mutationFn: () => runDeleteUser({ data: { userId: user.id } }),
    onSuccess: () => {
      setDeleteDialogOpen(false)
      showSuccessToast(t("admin.rowActions.deleteSuccess"))
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      onDelete?.()
    },
    onError: (error: unknown) => {
      const detail = error instanceof Error ? error.message : ""
      showErrorToast(detail || t("admin.rowActions.deleteError"))
    },
  })
  const handleEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setEditDialogOpen(true)
  }
  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setDeleteDialogOpen(true)
  }
  const handleDeleteConfirm = () => {
    deleteMutation.mutate()
  }
  const handleDeleteCancel = () => {
    if (!deleteMutation.isPending) setDeleteDialogOpen(false)
  }
  return (
    <>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title={t("admin.rowActions.edit")}>
          <span>
            <IconButton
              onClick={handleEdit}
              size="small"
              aria-label={t("admin.rowActions.edit")}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t("admin.rowActions.delete")}>
          <span>
            <IconButton
              onClick={handleDeleteClick}
              size="small"
              aria-label={t("admin.rowActions.delete")}
              color="error"
              disabled={deleteDisabled}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <EditUserDialog
        open={editDialogOpen}
        user={user}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={onEditSuccess}
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-user-dialog-title"
        aria-describedby="delete-user-dialog-description"
      >
        <DialogTitle id="delete-user-dialog-title">
          {t("admin.rowActions.deleteDialog.title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-user-dialog-description">
            {t("admin.rowActions.deleteDialog.description")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            disabled={deleteMutation.isPending}
          >
            {t("button.cancel")}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t("admin.rowActions.delete")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
