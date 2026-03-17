import LockIcon from "@mui/icons-material/Lock"
import {
  Box,
  Button,
  Container,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import type { AxiosError } from "axios"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LoginService } from "@/api"
import PageTopBanner from "@/components/Common/PageTopBanner"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { useBackendStatus } from "@/stores/useBackendStatus"
import { confirmPasswordRules, handleError, passwordRules } from "@/utils"

interface NewPasswordForm {
  new_password: string
  confirm_password: string
}

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/$productType",
        params: { productType: "fertilizer" },
      })
    }
  },
})

function ResetPassword() {
  const { t } = useTranslation(["auth", "common"])
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
    reset,
    formState: { errors },
  } = useForm<NewPasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      new_password: "",
    },
  })
  const { showSuccessToast } = useCustomToast()
  const navigate = useNavigate()
  const resetPassword = async (data: NewPasswordForm) => {
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) return
    await LoginService.resetPassword({
      body: { new_password: data.new_password, token: token },
    })
  }
  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      showSuccessToast(t("resetPassword.success"))
      reset()
      navigate({ to: "/login" })
    },
    onError: (err: AxiosError) => {
      handleError(err)
    },
  })
  const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
    mutation.mutate(data)
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
        <TextField
          {...register(
            "new_password",
            passwordRules(true, {
              required: t("signup.passwordRequired"),
              minLength: t("signup.passwordMinLength"),
            }),
          )}
          label={t("resetPassword.newPassword")}
          type="password"
          fullWidth
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
          label={t("resetPassword.confirmPassword")}
          type="password"
          fullWidth
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
            },
          }}
        />
        <Button variant="contained" type="submit" fullWidth size="large">
          {t("resetPassword.submit")}
        </Button>
      </Container>
    </>
  )
}
