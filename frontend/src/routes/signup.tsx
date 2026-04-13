// ============================== Sign up ==============================
import LockIcon from "@mui/icons-material/Lock"
import PersonIcon from "@mui/icons-material/Person"
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
import type { PrivateUserCreate } from "#/api"
import PageTopBanner from "#/components/Common/PageTopBanner"
import { useBackendHealthCheck } from "#/hooks/useBackendHealthCheck"
import { getCurrentUserFn, signUpFn } from "#/server/auth"
import { useBackendStatus } from "#/stores/useBackendStatus"
import {
  confirmPasswordRules,
  emailPattern,
  passwordRules,
} from "#/utils/form-validation"

interface UserRegisterForm extends PrivateUserCreate {
  confirm_password: string
}
export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user) {
      throw redirect({
        to: "/$productType",
        params: { productType: "fertilizer" },
      })
    }
  },
  component: SignUp,
})
function SignUp() {
  useBackendHealthCheck()
  const { t } = useTranslation(["auth", "common"])
  const { ready: backendReady } = useBackendStatus()
  const queryClient = useQueryClient()
  const [backendErrorDismissed, setBackendErrorDismissed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const signUp = useServerFn(signUpFn)
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
  const onSubmit: SubmitHandler<UserRegisterForm> = async (data) => {
    if (isSubmitting) return
    setServerError(null)
    const { confirm_password: _c, ...userData } = data
    try {
      const result = await signUp({ data: userData })
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
            {t("signup.title")}
          </Typography>
        </Box>
        {serverError ? (
          <Typography color="error" variant="body2" role="alert">
            {serverError}
          </Typography>
        ) : null}
        <TextField
          {...register("first_name", {
            required: t("signup.firstNameRequired"),
          })}
          required
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
          required
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
          required
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
          required
          label={t("signup.password")}
          type={showPassword ? "text" : "password"}
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
        <TextField
          {...register(
            "confirm_password",
            confirmPasswordRules(getValues, true, {
              required: t("signup.confirmPasswordRequired"),
              validate: t("signup.passwordsDoNotMatch"),
            }),
          )}
          required
          label={t("signup.confirmPassword")}
          type={showConfirmPassword ? "text" : "password"}
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
          disabled={isSubmitting}
          fullWidth
          size="large"
        >
          {isSubmitting ? t("signup.submitting") : t("signup.submit")}
        </Button>
        <Typography sx={{ textAlign: "center" }}>
          {t("signup.hasAccount")}{" "}
          <Link component={RouterLink} to="/login" underline="hover">
            {t("signup.logIn")}
          </Link>
        </Typography>
      </Container>
    </>
  )
}
