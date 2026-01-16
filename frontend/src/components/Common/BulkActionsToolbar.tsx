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
import { useSnackbar } from "@/components/SnackbarProvider"

interface BulkActionsToolbarProps {
  selectedCount: number
  onDelete: () => void
  onExport: () => void
  onClearSelection: () => void
}

export default function BulkActionsToolbar({
  selectedCount,
  onDelete,
  onExport,
  onClearSelection,
}: BulkActionsToolbarProps) {
  const { t } = useTranslation(["labels", "common"])
  const { showErrorToast } = useSnackbar()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }
  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false)
    showErrorToast(t("labels.bulkActions.deleteNotImplemented"))
    onDelete()
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
          {t("labels.bulkActions.selected", { count: selectedCount })}
        </Typography>
        <Button
          startIcon={<FileDownloadIcon />}
          onClick={handleExportClick}
          variant="outlined"
        >
          {t("labels.bulkActions.export")}
        </Button>
        <Button
          startIcon={<DeleteIcon />}
          onClick={handleDeleteClick}
          color="error"
          variant="outlined"
        >
          {t("labels.bulkActions.delete")}
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
          {t("labels.bulkActions.deleteDialog.title", { count: selectedCount })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="bulk-delete-dialog-description">
            {t("labels.bulkActions.deleteDialog.description", {
              count: selectedCount,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            {t("common.button.cancel")}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            {t("labels.bulkActions.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
