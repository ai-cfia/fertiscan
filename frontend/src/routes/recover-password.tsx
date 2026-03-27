// ============================== Recover password ==============================
import EmailIcon from "@mui/icons-material/Email"
import {
  Box,
  Button,
  Container,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import PageTopBanner from "#/components/Common/PageTopBanner"
import { useSnackbar } from "#/components/SnackbarProvider"
import { useBackendHealthCheck } from "#/hooks/useBackendHealthCheck"
import { getCurrentUserFn, recoverPasswordFn } from "#/server/auth"
import { useBackendStatus } from "#/stores/useBackendStatus"
import { emailPattern } from "#/utils/form-validation"

interface FormData {
  email: string
}
export const Route = createFileRoute("/recover-password")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user) {
      throw redirect({
        to: "/$productType",
        params: { productType: "fertilizer" },
      })
    }
  },
  component: RecoverPassword,
})
function RecoverPassword() {
  useBackendHealthCheck()
  const { t } = useTranslation(["auth", "common"])
  const { showSuccessToast } = useSnackbar()
  const { ready: backendReady } = useBackendStatus()
  const queryClient = useQueryClient()
  const [backendErrorDismissed, setBackendErrorDismissed] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const recoverPassword = useServerFn(recoverPasswordFn)
  useEffect(() => {
    if (backendReady) {
      setBackendErrorDismissed(false)
    }
  }, [backendReady])
  const handleBackendRetry = () => {
    queryClient.invalidateQueries({
      queryKey: ["backend", "health", "readiness"],
    })
  }
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>()
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (isSubmitting) return
    setServerError(null)
    const result = await recoverPassword({ data })
    if (result && typeof result === "object" && "ok" in result) {
      if (result.ok) {
        showSuccessToast(t("recoverPassword.success"))
        reset()
        return
      }
      setServerError(result.error)
    }
  }
  return (
    <>
      {!backendReady && !backendErrorDismissed && (
        <PageTopBanner
          message={t("backend.unavailable", { ns: "common" })}
          severity="error"
          onRetry={handleBackendRetry}
          onDismiss={() => setBackendErrorDismissed(true)}
        />
      )}
      <Container
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        maxWidth="sm"
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h4" component="h1">
            {t("recoverPassword.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t("recoverPassword.description")}
          </Typography>
        </Box>
        {serverError ? (
          <Typography color="error" variant="body2" role="alert">
            {serverError}
          </Typography>
        ) : null}
        <TextField
          {...register("email", {
            required: t("recoverPassword.emailRequired"),
            pattern: {
              value: emailPattern.value,
              message: t("recoverPassword.emailInvalid"),
            },
          })}
          required
          label={t("recoverPassword.email")}
          type="email"
          fullWidth
          error={!!errors.email}
          helperText={
            errors.email?.message ||
            t("recoverPassword.emailHelper", {
              defaultValue:
                "Enter your email address to receive a password reset link",
            })
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting}
          fullWidth
          size="large"
        >
          {isSubmitting
            ? t("recoverPassword.submitting")
            : t("recoverPassword.submit")}
        </Button>
      </Container>
    </>
  )
}
