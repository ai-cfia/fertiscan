import LockIcon from "@mui/icons-material/Lock"
import PersonIcon from "@mui/icons-material/Person"
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
import type { PrivateUserCreate } from "@/api"
import PageTopBanner from "@/components/Common/PageTopBanner"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { useBackendStatus } from "@/stores/useBackendStatus"
import { confirmPasswordRules, emailPattern, passwordRules } from "@/utils"

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/$productType",
        params: { productType: "fertilizer" },
      })
    }
  },
})

interface UserRegisterForm extends PrivateUserCreate {
  confirm_password: string
}

function SignUp() {
  const { t } = useTranslation(["auth", "common"])
  const { signUpMutation } = useAuth()
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
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
    },
  })
  const onSubmit: SubmitHandler<UserRegisterForm> = (data) => {
    const { confirm_password: _confirm_password, ...userData } = data
    signUpMutation.mutate(userData)
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
            {t("signup.title")}
          </Typography>
        </Box>
        <TextField
          {...register("first_name", {
            required: t("signup.firstNameRequired"),
          })}
          label={t("signup.firstName")}
          type="text"
          fullWidth
          error={!!errors.first_name}
          helperText={
            errors.first_name?.message ||
            t("signup.firstNameHelper", {
              defaultValue: "Enter your first name",
            })
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          {...register("last_name", {
            required: t("signup.lastNameRequired"),
          })}
          label={t("signup.lastName")}
          type="text"
          fullWidth
          error={!!errors.last_name}
          helperText={
            errors.last_name?.message ||
            t("signup.lastNameHelper", { defaultValue: "Enter your last name" })
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          {...register("email", {
            required: t("signup.emailRequired"),
            pattern: {
              ...emailPattern,
              message: t("signup.emailInvalid"),
            },
          })}
          label={t("signup.email")}
          type="email"
          fullWidth
          error={!!errors.email}
          helperText={
            errors.email?.message ||
            t("signup.emailHelper", {
              defaultValue: "Enter your email address",
            })
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
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
          label={t("signup.password")}
          type="password"
          fullWidth
          error={!!errors.password}
          helperText={
            errors.password?.message ||
            t("signup.passwordHelper", {
              defaultValue: "Enter a secure password",
            })
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
        <TextField
          {...register(
            "confirm_password",
            confirmPasswordRules(getValues, true, {
              required: t("signup.confirmPasswordRequired"),
              validate: t("signup.passwordsDoNotMatch"),
            }),
          )}
          label={t("signup.confirmPassword")}
          type="password"
          fullWidth
          error={!!errors.confirm_password}
          helperText={
            errors.confirm_password?.message ||
            t("signup.confirmPasswordHelper", {
              defaultValue: "Re-enter your password to confirm",
            })
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
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting}
          fullWidth
          size="large"
        >
          {isSubmitting ? t("signup.submitting") : t("signup.submit")}
        </Button>
        <Typography textAlign="center">
          {t("signup.hasAccount")}{" "}
          <Link component={RouterLink} to="/login" underline="hover">
            {t("signup.logIn")}
          </Link>
        </Typography>
      </Container>
    </>
  )
}
