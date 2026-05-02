// ============================== Bulk actions toolbar ==============================

import CloseIcon from "@mui/icons-material/Close"
import DeleteIcon from "@mui/icons-material/Delete"
import FileDownloadIcon from "@mui/icons-material/FileDownload"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSnackbar } from "#/components/SnackbarProvider"

type BulkActionsToolbarProps = {
  selectedCount: number
  selectedText: string
  deleteButtonText: string
  exportButtonText: string
  deleteDialogTitle: string
  deleteDialogDescription: string
  onDelete: () => void | Promise<void>
  onExport: () => void
  onClearSelection: () => void
  isDeleting?: boolean
}

export default function BulkActionsToolbar({
  selectedCount,
  selectedText,
  deleteButtonText,
  exportButtonText,
  deleteDialogTitle,
  deleteDialogDescription,
  onDelete,
  onExport,
  onClearSelection,
  isDeleting = false,
}: BulkActionsToolbarProps) {
  const { t } = useTranslation(["labels", "common"])
  const { showErrorToast } = useSnackbar()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }
  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false)
    await onDelete()
  }
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }
  const handleExportClick = () => {
    showErrorToast(t("labels.bulkActions.exportNotImplemented"))
    onExport()
  }
  return (
    <>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          gap: 1,
          bgcolor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
        }}
      >
        <Typography
          sx={{ flex: "1 1 100%" }}
          variant="h6"
          component="div"
          id="bulk-actions-title"
        >
          {selectedText}
        </Typography>
        <Button
          startIcon={<FileDownloadIcon />}
          onClick={handleExportClick}
          variant="outlined"
        >
          {exportButtonText}
        </Button>
        <Button
          startIcon={<DeleteIcon />}
          onClick={handleDeleteClick}
          color="error"
          variant="outlined"
          disabled={isDeleting || selectedCount === 0}
        >
          {deleteButtonText}
        </Button>
        <IconButton
          onClick={onClearSelection}
          aria-label={t("common.aria.clearSelection")}
        >
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="bulk-delete-dialog-title"
        aria-describedby="bulk-delete-dialog-description"
      >
        <DialogTitle id="bulk-delete-dialog-title">
          {deleteDialogTitle}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="bulk-delete-dialog-description">
            {deleteDialogDescription}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            {t("common.button.cancel")}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {deleteButtonText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
