import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
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
import type { ReviewStatus } from "@/api"
import { useSnackbar } from "@/components/SnackbarProvider"

interface LabelRowActionsProps {
  reviewStatus: ReviewStatus | null
  onViewDetails: () => void
  onReview: () => void
  onDelete: () => void
}

export default function LabelRowActions({
  reviewStatus,
  onViewDetails,
  onReview,
  onDelete,
}: LabelRowActionsProps) {
  const { t } = useTranslation(["labels", "common"])
  const { showErrorToast } = useSnackbar()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const handleViewDetails = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onViewDetails()
  }
  const handleReview = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onReview()
  }
  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setDeleteDialogOpen(true)
  }
  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false)
    showErrorToast(t("labels.rowActions.deleteNotImplemented"))
    onDelete()
  }
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }
  const editTooltip =
    reviewStatus === "not_started"
      ? t("labels.rowActions.editLabel")
      : t("labels.rowActions.continueEdit")
  return (
    <>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title={editTooltip}>
          <IconButton
            onClick={handleReview}
            size="small"
            aria-label={editTooltip}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("labels.rowActions.viewDetails")}>
          <IconButton
            onClick={handleViewDetails}
            size="small"
            aria-label={t("labels.rowActions.viewDetails")}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("labels.rowActions.delete")}>
          <IconButton
            onClick={handleDeleteClick}
            size="small"
            aria-label={t("labels.rowActions.delete")}
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
          {t("labels.rowActions.deleteDialog.title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t("labels.rowActions.deleteDialog.description")}
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
            {t("labels.rowActions.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
