// ============================== New label ==============================

import AddIcon from "@mui/icons-material/Add"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import DeleteIcon from "@mui/icons-material/Delete"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Toolbar,
  Typography,
} from "@mui/material"
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  createLabelForUploadFn,
  uploadLabelImageFn,
} from "#/server/label-upload"
import { useConfig } from "#/stores/useConfig"
import { useLabelNew } from "#/stores/useLabelNew"

export const Route = createFileRoute("/_layout/$productType/labels/new")({
  component: NewLabel,
})

// ============================== Constants ==============================
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const
// --- Server upload payload (binary JSON-safe) ---
async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function NewLabel() {
  const { t } = useTranslation(["labels", "errors", "common"])
  const { t: tLabels } = useTranslation("labels")
  const { maxImagesPerLabel } = useConfig()
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const productType = (params.productType as string) || "fertilizer"
  const runCreateLabel = useServerFn(createLabelForUploadFn)
  const runUploadLabelImage = useServerFn(uploadLabelImageFn)
  const uploadApi = useMemo(
    () => ({
      createLabel: async (pt: string) => {
        const out = await runCreateLabel({ data: { productType: pt } })
        return { id: out.id }
      },
      uploadLabelImage: async (
        labelId: string,
        displayFilename: string,
        contentType: "image/png" | "image/jpeg" | "image/webp",
        sequenceOrder: number,
        file: File,
      ) => {
        const fileBase64 = await fileToBase64(file)
        return runUploadLabelImage({
          data: {
            labelId,
            displayFilename,
            contentType,
            sequenceOrder,
            fileBase64,
          },
        })
      },
    }),
    [runCreateLabel, runUploadLabelImage],
  )
  const {
    uploadedFiles,
    addUploadedFiles,
    removeFile,
    clearAll,
    isProcessing,
    addFileTypeValidationErrors,
    process,
  } = useLabelNew()
  const [isDragging, setIsDragging] = useState(false)
  useEffect(() => {
    document.title = tLabels("labels.create.pageTitle")
    if (!isProcessing) {
      clearAll()
    }
  }, [clearAll, isProcessing, tLabels])
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    const validFiles: File[] = []
    const errors: string[] = []
    Array.from(files).forEach((file) => {
      if (ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
        validFiles.push(file)
      } else {
        errors.push(t("errors.fileType.invalid", { fileName: file.name }))
      }
    })
    if (validFiles.length > 0) {
      addUploadedFiles(validFiles)
    }
    if (errors.length > 0) {
      addFileTypeValidationErrors(errors)
    }
  }
  const handleDragOver = (e: React.DragEvent) => {
    if (uploadedFiles.length >= maxImagesPerLabel) {
      return
    }
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => {
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    if (uploadedFiles.length >= maxImagesPerLabel) {
      return
    }
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }
  const tCreateWarn = tLabels as (
    k:
      | "labels.create.maxFilesWarning_one"
      | "labels.create.maxFilesWarning_other",
    o: { count: number; max: number },
  ) => string
  const maxFilesOver = uploadedFiles.length - maxImagesPerLabel
  const maxFilesWarningMessage =
    maxFilesOver > 0
      ? tCreateWarn(
          maxFilesOver === 1
            ? "labels.create.maxFilesWarning_one"
            : "labels.create.maxFilesWarning_other",
          maxFilesOver === 1
            ? { count: 1, max: maxImagesPerLabel }
            : { count: maxFilesOver, max: maxImagesPerLabel },
        )
      : null
  return (
    <Container maxWidth="xl">
      <Box sx={{ pt: 3, pb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* ============================== Header ============================== */}
          <Box component="section">
            <Typography variant="h4" gutterBottom>
              {tLabels("labels.create.title")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {tLabels("labels.create.description")}
            </Typography>
          </Box>
          {/* ============================== Selected files ============================== */}
          <Box component="section">
            {maxFilesWarningMessage !== null && (
              <Alert variant="outlined" severity="warning" sx={{ mb: 2 }}>
                {maxFilesWarningMessage}
              </Alert>
            )}
            <Toolbar
              sx={{
                minHeight: "48px !important",
                px: 1,
                justifyContent: "space-between",
                gap: 1,
                mb: 0,
              }}
            >
              <Typography variant="h6" sx={{ flexGrow: 0 }}>
                {tLabels("labels.create.selectedFiles")} ({uploadedFiles.length}{" "}
                {tLabels("labels.create.of")} {maxImagesPerLabel})
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {uploadedFiles.length > 0 && (
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={clearAll}
                    disabled={isProcessing}
                  >
                    {t("button.clearAll", { ns: "common" })}
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="inherit"
                  onClick={() =>
                    void process(
                      productType,
                      (labelId) => {
                        navigate({
                          to: "/$productType/labels/$labelId/files",
                          params: { productType, labelId },
                        })
                      },
                      uploadApi,
                    )
                  }
                  disabled={
                    isProcessing ||
                    uploadedFiles.length === 0 ||
                    uploadedFiles.length > maxImagesPerLabel
                  }
                  startIcon={<CloudUploadIcon />}
                >
                  {isProcessing
                    ? t("button.uploading", { ns: "common" })
                    : t("button.upload", { ns: "common" })}
                </Button>
              </Box>
            </Toolbar>
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: (theme) =>
                  `2px dashed ${
                    uploadedFiles.length >= maxImagesPerLabel
                      ? theme.palette.action.disabled
                      : isDragging
                        ? theme.palette.primary.main
                        : theme.palette.divider
                  }`,
                borderRadius: 1,
                backgroundColor: (theme) =>
                  uploadedFiles.length >= maxImagesPerLabel
                    ? theme.palette.action.disabledBackground
                    : isDragging
                      ? theme.palette.action.selected
                      : "transparent",
                transition: "all 0.15s ease-in-out",
                p: 2,
              }}
            >
              <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
                {uploadedFiles.map((file, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CardContent
                        sx={{
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Box
                          component="img"
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          sx={{
                            width: "100%",
                            height: "200px",
                            objectFit: "contain",
                            mb: 1,
                            backgroundColor: "grey.100",
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2" noWrap sx={{ mb: 0.5 }}>
                          {file.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => removeFile(index)}
                          sx={{ mt: "auto" }}
                        >
                          {tLabels("labels.create.remove")}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    disabled={uploadedFiles.length >= maxImagesPerLabel}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2,
                      textTransform: "none",
                      minHeight: "300px",
                    }}
                  >
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      disabled={uploadedFiles.length >= maxImagesPerLabel}
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />
                    <Box
                      sx={{
                        height: "200px",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                      }}
                    >
                      <AddIcon
                        sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center", px: 1 }}
                      >
                        {tLabels("labels.create.selectFiles")}
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
