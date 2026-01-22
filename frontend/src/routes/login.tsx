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
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { BodyLoginLoginAccessToken as AccessToken } from "@/api"
import BackendStatusBanner from "@/components/Common/BackendStatusBanner"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
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
  const { t } = useTranslation("auth")
  const { loginMutation, error, resetError } = useAuth()
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
    resetError()
    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }
  return (
    <>
      <BackendStatusBanner />
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
          error={!!errors.username || !!error}
          helperText={
            errors.username?.message || (error ? t("login.failed") : "")
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
          helperText={errors.password?.message}
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
