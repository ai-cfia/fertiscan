// ============================== Label image card ==============================
// --- Presigned URL + delete via server fns (session bearer) ---

import DeleteIcon from "@mui/icons-material/Delete"
import ImageIcon from "@mui/icons-material/Image"
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { LabelImageDetail } from "#/api/types.gen"
import { useSnackbar } from "#/components/SnackbarProvider"
import {
  deleteLabelImageFn,
  getLabelImageDataFn,
} from "#/server/label-editor"

type LabelImageCardProps = {
  image: LabelImageDetail
  labelId: string
}

export default function LabelImageCard({
  image,
  labelId,
}: LabelImageCardProps) {
  const { t } = useTranslation(["labels", "common"])
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const getImageData = useServerFn(getLabelImageDataFn)
  const deleteImage = useServerFn(deleteLabelImageFn)
  const shouldFetchUrl = image.status === "completed"
  const { data: displayUrl = null, isLoading: isLoadingUrl } = useQuery({
    queryKey: ["labels", labelId, "images", image.id, "presigned-download-url"],
    queryFn: async () => getImageData({ data: { labelId, imageId: image.id } }),
    enabled: shouldFetchUrl,
  })
  const isImageLoading = Boolean(displayUrl) && !imageLoaded && !imageError
  const showSpinner = isLoadingUrl || isImageLoading
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteImage({ data: { labelId, imageId: image.id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels", labelId, "images"] })
      showSuccessToast(t("image.deleteSuccess"))
      setDeleteDialogOpen(false)
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t("image.deleteError")
      showErrorToast(msg || t("image.deleteError"))
    },
  })
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }
  const handleDeleteConfirm = () => {
    deleteMutation.mutate()
  }
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }
  return (
    <Card>
      <CardContent>
        {displayUrl && !imageError ? (
          <Box
            sx={{
              width: "100%",
              height: "200px",
              mb: 1,
              backgroundColor: "grey.100",
              borderRadius: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {showSpinner && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "grey.100",
                  borderRadius: 1,
                }}
              >
                <CircularProgress size={32} />
              </Box>
            )}
            <Box
              component="img"
              src={displayUrl}
              alt={image.display_filename}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.error(
                  `Failed to load image: ${image.display_filename} (${displayUrl})`,
                )
                setImageError(true)
              }}
              sx={{
                width: "100%",
                height: "200px",
                objectFit: "contain",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.2s ease-in-out",
              }}
            />
          </Box>
        ) : isLoadingUrl ? (
          <Box
            sx={{
              width: "100%",
              height: "200px",
              mb: 1,
              backgroundColor: "grey.100",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "200px",
              mb: 1,
              backgroundColor: "grey.100",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <ImageIcon sx={{ fontSize: 48, color: "grey.400" }} />
            <Typography variant="caption" color="text.secondary">
              {t("image.notAvailable")}
            </Typography>
          </Box>
        )}
        <Typography variant="body2">{image.display_filename}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t("image.sequence", {
            order: String(image.sequence_order),
            defaultValue: "Sequence: {{order}}",
          })}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
        <IconButton
          onClick={handleDeleteClick}
          color="error"
          size="small"
          aria-label={t("image.delete")}
          disabled={deleteMutation.isPending}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CardActions>
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {t("image.deleteDialog.title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t("image.deleteDialog.description", {
              filename: image.display_filename,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            disabled={deleteMutation.isPending}
          >
            {t("button.cancel", { ns: "common" })}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {t("image.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
