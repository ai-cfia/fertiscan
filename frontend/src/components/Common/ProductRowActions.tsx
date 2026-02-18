import DeleteIcon from "@mui/icons-material/Delete"
import VisibilityIcon from "@mui/icons-material/Visibility"
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@mui/material"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSnackbar } from "@/components/SnackbarProvider"

interface ProductRowActionsProps {
  onViewDetails: () => void
  onDelete: () => void
}

export default function ProductRowActions({
  onViewDetails,
  onDelete,
}: ProductRowActionsProps) {
  const { t } = useTranslation(["products", "common"])
  const { showErrorToast } = useSnackbar()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleViewDetails = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onViewDetails()
  }

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false)
    showErrorToast(t("products.rowActions.deleteNotImplemented"))
    onDelete()
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }

  return (
    <>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title={t("products.rowActions.viewDetails")}>
          <IconButton
            onClick={handleViewDetails}
            size="small"
            aria-label={t("products.rowActions.viewDetails")}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("products.rowActions.delete")}>
          <IconButton
            onClick={handleDeleteClick}
            size="small"
            aria-label={t("products.rowActions.delete")}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {t("products.rowActions.deleteDialog.title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t("products.rowActions.deleteDialog.description")}
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
            {t("products.rowActions.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
