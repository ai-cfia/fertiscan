// ============================== Login ==============================
import EmailIcon from "@mui/icons-material/Email"
import LockIcon from "@mui/icons-material/Lock"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import {
  createFileRoute,
  isRedirect,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { BodyLoginLoginAccessToken } from "#/api"
import PageTopBanner from "#/components/Common/PageTopBanner"
import { useBackendHealthCheck } from "#/hooks/useBackendHealthCheck"
import { getCurrentUserFn, loginFn } from "#/server/auth"
import { useBackendStatus } from "#/stores/useBackendStatus"
import { emailPattern, passwordRules } from "#/utils/form-validation"

type LoginFormValues = Pick<BodyLoginLoginAccessToken, "username" | "password">
export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
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
  component: Login,
})
function Login() {
  useBackendHealthCheck()
  const { t } = useTranslation(["auth", "common"])
  const { ready: backendReady } = useBackendStatus()
  const queryClient = useQueryClient()
  const [backendErrorDismissed, setBackendErrorDismissed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const login = useServerFn(loginFn)
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
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })
  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    if (isSubmitting) return
    setServerError(null)
    try {
      const result = await login({
        data: { username: data.username, password: data.password },
      })
      if (
        result &&
        typeof result === "object" &&
        "ok" in result &&
        result.ok === false
      ) {
        setServerError(result.error)
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
            {t("login.title")}
          </Typography>
        </Box>
        {serverError ? (
          <Typography color="error" variant="body2" role="alert">
            {serverError}
          </Typography>
        ) : null}
        <TextField
          {...register("username", {
            required: t("login.usernameRequired"),
            pattern: {
              ...emailPattern,
              message: t("login.emailInvalid"),
            },
          })}
          required
          label={t("login.email")}
          type="email"
          fullWidth
          error={!!errors.username}
          helperText={
            errors.username?.message ||
            t("login.emailHelper", { defaultValue: "Enter your email address" })
          }
          slotProps={{
            input: {
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: "action.active" }} />
              ),
            },
          }}
        />
        <TextField
          {...register(
            "password",
            passwordRules(true, {
              required: t("signup.passwordRequired"),
              minLength: t("signup.passwordMinLength"),
            }),
          )}
          required
          label={t("login.password")}
          type={showPassword ? "text" : "password"}
          fullWidth
          error={!!errors.password}
          helperText={
            errors.password?.message ||
            t("login.passwordHelper", { defaultValue: "Enter your password" })
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
                    onClick={() => setShowPassword((prev) => !prev)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Link component={RouterLink} to="/recover-password" underline="hover">
          {t("login.forgotPassword")}
        </Link>
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting}
          fullWidth
          size="large"
        >
          {isSubmitting ? t("login.submitting") : t("login.submit")}
        </Button>
        <Typography sx={{ textAlign: "center" }}>
          {t("login.noAccount")}{" "}
          <Link component={RouterLink} to="/signup" underline="hover">
            {t("login.signUp")}
          </Link>
        </Typography>
      </Container>
    </>
  )
}
