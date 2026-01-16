import DeleteIcon from "@mui/icons-material/Delete"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import VisibilityIcon from "@mui/icons-material/Visibility"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSnackbar } from "@/components/SnackbarProvider"

interface LabelRowActionsProps {
  labelId: string
  onViewDetails: () => void
  onDelete: () => void
}

export default function LabelRowActions({
  labelId,
  onViewDetails,
  onDelete,
}: LabelRowActionsProps) {
  const { t } = useTranslation(["labels", "common"])
  const { showErrorToast } = useSnackbar()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  const handleViewDetails = () => {
    handleClose()
    onViewDetails()
  }
  const handleDeleteClick = () => {
    handleClose()
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
  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-label={t("labels.rowActions.actionsForLabel", { id: labelId })}
        aria-controls={open ? `label-menu-${labelId}` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id={`label-menu-${labelId}`}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("labels.rowActions.viewDetails")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("labels.rowActions.delete")}</ListItemText>
        </MenuItem>
      </Menu>
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
