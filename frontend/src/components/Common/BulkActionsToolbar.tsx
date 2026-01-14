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
  const { showErrorToast } = useSnackbar()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }
  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false)
    showErrorToast("Bulk delete functionality not yet implemented")
    onDelete()
  }
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }
  const handleExportClick = () => {
    showErrorToast("Export functionality not yet implemented")
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
          {selectedCount} selected
        </Typography>
        <Button
          startIcon={<FileDownloadIcon />}
          onClick={handleExportClick}
          variant="outlined"
        >
          Export
        </Button>
        <Button
          startIcon={<DeleteIcon />}
          onClick={handleDeleteClick}
          color="error"
          variant="outlined"
        >
          Delete
        </Button>
        <IconButton onClick={onClearSelection} aria-label="clear selection">
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
          Delete {selectedCount} Label{selectedCount !== 1 ? "s" : ""}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="bulk-delete-dialog-description">
            Are you sure you want to delete {selectedCount} selected label
            {selectedCount !== 1 ? "s" : ""}? This action cannot be undone and
            will permanently delete the label{selectedCount !== 1 ? "s" : ""}{" "}
            and all associated files.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
