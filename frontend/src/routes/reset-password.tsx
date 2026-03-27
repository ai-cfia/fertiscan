// ============================== Reset password ==============================
import LockIcon from "@mui/icons-material/Lock"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import {
  createFileRoute,
  isRedirect,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import PageTopBanner from "#/components/Common/PageTopBanner"
import { useSnackbar } from "#/components/SnackbarProvider"
import { useBackendHealthCheck } from "#/hooks/useBackendHealthCheck"
import { getCurrentUserFn, resetPasswordFn } from "#/server/auth"
import { useBackendStatus } from "#/stores/useBackendStatus"
import { confirmPasswordRules, passwordRules } from "#/utils/form-validation"

interface NewPasswordForm {
  new_password: string
  confirm_password: string
}
export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user) {
      throw redirect({
        to: "/$productType",
        params: { productType: "fertilizer" },
      })
    }
  },
  component: ResetPassword,
})
function ResetPassword() {
  useBackendHealthCheck()
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const { t } = useTranslation(["auth", "common"])
  const { showSuccessToast } = useSnackbar()
  const { ready: backendReady } = useBackendStatus()
  const queryClient = useQueryClient()
  const [backendErrorDismissed, setBackendErrorDismissed] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const resetPassword = useServerFn(resetPasswordFn)
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
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })
  const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
    if (isSubmitting) return
    setServerError(null)
    if (!token) {
      setServerError(
        t("labels.errorOccurred", {
          ns: "errors",
          defaultValue: "Something went wrong",
        }),
      )
      return
    }
    try {
      const result = await resetPassword({
        data: { token, new_password: data.new_password },
      })
      if (
        result &&
        typeof result === "object" &&
        "ok" in result &&
        result.ok === false
      ) {
        setServerError(result.error)
      } else {
        showSuccessToast(t("resetPassword.success"))
        reset()
        navigate({ to: "/login", search: { redirect: undefined } })
      }
    } catch (err) {
      if (isRedirect(err)) {
        throw err
      }
      setServerError(
        t("labels.errorOccurred", {
          ns: "errors",
          defaultValue: "Something went wrong",
        }),
      )
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
            {t("resetPassword.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t("resetPassword.description")}
          </Typography>
        </Box>
        {!token ? (
          <Typography color="error" variant="body2" role="alert">
            {t("labels.errorOccurred", {
              ns: "errors",
              defaultValue: "Invalid or missing reset link",
            })}
          </Typography>
        ) : null}
        {serverError ? (
          <Typography color="error" variant="body2" role="alert">
            {serverError}
          </Typography>
        ) : null}
        <TextField
          {...register(
            "new_password",
            passwordRules(true, {
              required: t("signup.passwordRequired"),
              minLength: t("signup.passwordMinLength"),
            }),
          )}
          required
          label={t("resetPassword.newPassword")}
          type={showNewPassword ? "text" : "password"}
          fullWidth
          disabled={!token}
          error={!!errors.new_password}
          helperText={
            errors.new_password?.message ||
            t("resetPassword.newPasswordHelper", {
              defaultValue: "Enter your new password",
            })
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t("aria.togglePasswordVisibility", {
                      ns: "common",
                    })}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          {...register(
            "confirm_password",
            confirmPasswordRules(getValues, true, {
              required: t("signup.confirmPasswordRequired"),
              validate: t("signup.passwordsDoNotMatch"),
            }),
          )}
          required
          label={t("resetPassword.confirmPassword")}
          type={showConfirmPassword ? "text" : "password"}
          fullWidth
          disabled={!token}
          error={!!errors.confirm_password}
          helperText={
            errors.confirm_password?.message ||
            t("resetPassword.confirmPasswordHelper", {
              defaultValue: "Re-enter your new password to confirm",
            })
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t("aria.togglePasswordVisibility", {
                      ns: "common",
                    })}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting || !token}
          fullWidth
          size="large"
        >
          {t("resetPassword.submit")}
        </Button>
      </Container>
    </>
  )
}
