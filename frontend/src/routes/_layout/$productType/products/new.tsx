import { zodResolver } from "@hookform/resolvers/zod"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import type { ProductPublic } from "@/api"
import { ProductsService } from "@/api"
import { client } from "@/api/client.gen"
import { useSnackbar } from "@/components/SnackbarProvider"

// ============================== Constants ==============================
const VALID_PRODUCT_TYPES = ["fertilizer"] as const

const productTypeParamsSchema = z.object({
  productType: z.enum(VALID_PRODUCT_TYPES),
})

// ============================== Schema ==============================
const createProductFormSchema = (t: (key: string) => string) =>
  z.object({
    registration_number: z
      .string()
      .min(1, t("products.create.form.registrationNumber.required"))
      .max(50, t("products.create.form.registrationNumber.maxLength"))
      .regex(
        /^[a-zA-Z0-9\s-]+$/,
        t("products.create.form.registrationNumber.invalidFormat"),
      ),
    brand_name_en: z
      .string()
      .max(100, t("products.create.form.brandNameEn.maxLength"))
      .optional()
      .nullable(),
    brand_name_fr: z
      .string()
      .max(100, t("products.create.form.brandNameFr.maxLength"))
      .optional()
      .nullable(),
    name_en: z
      .string()
      .max(200, t("products.create.form.nameEn.maxLength"))
      .optional()
      .nullable(),
    name_fr: z
      .string()
      .max(200, t("products.create.form.nameFr.maxLength"))
      .optional()
      .nullable(),
  })

type ProductFormData = z.infer<ReturnType<typeof createProductFormSchema>>

// ============================== Route ==============================
export const Route = createFileRoute("/_layout/$productType/products/new")({
  beforeLoad: async ({ params }) => {
    const result = productTypeParamsSchema.safeParse(params)
    if (!result.success) {
      throw notFound()
    }
  },
  component: CreateProduct,
})

// ============================== Component ==============================
function CreateProduct() {
  // --- Hooks and State ---
  const { t } = useTranslation("common")
  const { productType } = Route.useParams()
  const navigate = useNavigate()
  const { showSuccessToast } = useSnackbar()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const productFormSchema = createProductFormSchema(t)
  // --- Form Setup ---
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    mode: "onBlur",
    defaultValues: {
      registration_number: "",
      brand_name_en: null,
      brand_name_fr: null,
      name_en: null,
      name_fr: null,
    },
  })
  const registrationNumber = watch("registration_number")
  // --- Duplicate Check Logic ---
  const [debouncedRegistrationNumber, setDebouncedRegistrationNumber] =
    useState(registrationNumber)
  const shouldCheck =
    !!registrationNumber?.trim() &&
    debouncedRegistrationNumber.length > 0 &&
    debouncedRegistrationNumber === registrationNumber.trim()
  const checkDuplicate = useCallback(async () => {
    if (!registrationNumber.trim()) {
      return false
    }
    const trimmed = registrationNumber.trim()
    const response = await ProductsService.readProducts({
      query: {
        product_type: productType,
        registration_number: trimmed,
        limit: 1,
      } as any,
    })
    return (response.data?.items?.length ?? 0) > 0
  }, [productType, registrationNumber])
  // --- Queries ---
  const duplicateQuery = useQuery({
    queryKey: [
      "products",
      "duplicate-check",
      productType,
      debouncedRegistrationNumber,
    ],
    queryFn: async () => {
      const response = await ProductsService.readProducts({
        query: {
          product_type: productType,
          registration_number: debouncedRegistrationNumber,
          limit: 1,
        } as any,
      })
      return response.data
    },
    enabled: shouldCheck,
    retry: false,
  })
  const createMutation = useMutation({
    mutationFn: async (data: Omit<ProductFormData, "product_type">) => {
      const response = await client.post<ProductPublic>({
        url: "/api/v1/products",
        body: {
          ...data,
          product_type: productType,
        },
        responseType: "json",
        security: [{ scheme: "bearer", type: "http" }],
      })
      if (response instanceof Error) {
        throw response
      }
      return response.data
    },
    onSuccess: (data) => {
      if (data && typeof data === "object" && "id" in data) {
        navigate({
          to: "/$productType/products",
          params: { productType },
        })
      }
    },
  })
  const isDuplicate = useMemo(
    () => (duplicateQuery.data?.items?.length ?? 0) > 0,
    [duplicateQuery.data],
  )
  // --- Effects ---
  // Debounce registration number input to avoid excessive API calls while typing
  useEffect(() => {
    const enabled = !!registrationNumber?.trim()
    if (!enabled || !registrationNumber.trim()) {
      setDebouncedRegistrationNumber("")
      return
    }
    const timer = setTimeout(() => {
      setDebouncedRegistrationNumber(registrationNumber.trim())
    }, 400)
    return () => clearTimeout(timer)
  }, [registrationNumber])
  // Set page title
  useEffect(() => {
    document.title = t("products.create.pageTitle")
  }, [t])
  // Warn user before leaving page if form has unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isDirty])
  // --- Event Handlers ---
  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    setApiError(null)
    const trimmedData = {
      registration_number: data.registration_number.trim(),
      brand_name_en: data.brand_name_en?.trim() || null,
      brand_name_fr: data.brand_name_fr?.trim() || null,
      name_en: data.name_en?.trim() || null,
      name_fr: data.name_fr?.trim() || null,
    }
    const duplicateFound = await checkDuplicate()
    if (duplicateFound) {
      setApiError(t("products.create.form.registrationNumber.duplicate"))
      return
    }
    try {
      await createMutation.mutateAsync(trimmedData)
      showSuccessToast(t("products.create.form.success"))
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        t("products.create.form.error")
      setApiError(errorMessage)
    }
  }
  const handleCancel = () => {
    if (isDirty) {
      setCancelDialogOpen(true)
    } else {
      navigate({
        to: "/$productType/products",
        params: { productType },
      })
    }
  }
  const handleCancelConfirm = () => {
    setCancelDialogOpen(false)
    navigate({
      to: "/$productType/products",
      params: { productType },
    })
  }
  const handleCancelCancel = () => {
    setCancelDialogOpen(false)
  }
  // --- Computed Values ---
  const isDuplicateError = isDuplicate && registrationNumber?.trim()
  const isFormDisabled = isSubmitting || createMutation.isPending
  // --- Render ---
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        {t("products.create.title")}
      </Typography>
      {apiError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setApiError(null)}
        >
          {apiError}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {/* Registration Number */}
        <Controller
          name="registration_number"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("products.create.form.registrationNumber.label")}
              required
              fullWidth
              error={!!errors.registration_number || !!isDuplicateError}
              helperText={
                errors.registration_number?.message ||
                (isDuplicateError
                  ? t("products.create.form.registrationNumber.duplicate")
                  : duplicateQuery.isLoading
                    ? t("products.create.form.registrationNumber.checking")
                    : t("products.create.form.registrationNumber.helperText"))
              }
              disabled={isFormDisabled}
              sx={{ mb: 2 }}
            />
          )}
        />
        {/* Brand Names */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="brand_name_en"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ""}
                  label={t("products.create.form.brandNameEn.label")}
                  fullWidth
                  error={!!errors.brand_name_en}
                  helperText={
                    errors.brand_name_en?.message ||
                    t("products.create.form.brandNameEn.helperText")
                  }
                  disabled={isFormDisabled}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="brand_name_fr"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ""}
                  label={t("products.create.form.brandNameFr.label")}
                  fullWidth
                  error={!!errors.brand_name_fr}
                  helperText={
                    errors.brand_name_fr?.message ||
                    t("products.create.form.brandNameFr.helperText")
                  }
                  disabled={isFormDisabled}
                />
              )}
            />
          </Grid>
        </Grid>
        {/* Product Names */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="name_en"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ""}
                  label={t("products.create.form.nameEn.label")}
                  fullWidth
                  error={!!errors.name_en}
                  helperText={
                    errors.name_en?.message ||
                    t("products.create.form.nameEn.helperText")
                  }
                  disabled={isFormDisabled}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="name_fr"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ""}
                  label={t("products.create.form.nameFr.label")}
                  fullWidth
                  error={!!errors.name_fr}
                  helperText={
                    errors.name_fr?.message ||
                    t("products.create.form.nameFr.helperText")
                  }
                  disabled={isFormDisabled}
                />
              )}
            />
          </Grid>
        </Grid>
        {/* Form Actions */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isFormDisabled}
          >
            {t("products.create.form.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isFormDisabled || !!isDuplicateError}
            startIcon={
              isFormDisabled ? <CircularProgress size={20} /> : undefined
            }
          >
            {t("products.create.form.submit")}
          </Button>
        </Box>
      </Box>
      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCancelCancel}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">
          {t("products.create.form.cancelDialog.title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            {t("products.create.form.cancelDialog.message")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCancel}>
            {t("products.create.form.cancelDialog.keepEditing")}
          </Button>
          <Button
            onClick={handleCancelConfirm}
            variant="contained"
            color="error"
          >
            {t("products.create.form.cancelDialog.discard")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
