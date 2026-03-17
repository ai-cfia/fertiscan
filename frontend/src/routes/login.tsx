import EmailIcon from "@mui/icons-material/Email"
import LockIcon from "@mui/icons-material/Lock"
import {
  Box,
  Button,
  Container,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { BodyLoginLoginAccessToken as AccessToken } from "@/api"
import PageTopBanner from "@/components/Common/PageTopBanner"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { useBackendStatus } from "@/stores/useBackendStatus"
import { emailPattern, passwordRules } from "@/utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/$productType",
        params: { productType: "fertilizer" },
      })
    }
  },
})

function Login() {
  const { t } = useTranslation(["auth", "common"])
  const { loginMutation } = useAuth()
  const { ready: backendReady } = useBackendStatus()
  const queryClient = useQueryClient()
  const [backendErrorDismissed, setBackendErrorDismissed] = useState(false)
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
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })
  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return
    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
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
        <TextField
          {...register("username", {
            required: t("login.usernameRequired"),
            pattern: {
              ...emailPattern,
              message: t("login.emailInvalid"),
            },
          })}
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
          label={t("login.password")}
          type="password"
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
        <Typography textAlign="center">
          {t("login.noAccount")}{" "}
          <Link component={RouterLink} to="/signup" underline="hover">
            {t("login.signUp")}
          </Link>
        </Typography>
      </Container>
    </>
  )
}
