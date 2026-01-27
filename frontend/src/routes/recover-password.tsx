import EmailIcon from "@mui/icons-material/Email"
import {
  Box,
  Button,
  Container,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import type { AxiosError } from "axios"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LoginService } from "@/api"
import PageTopBanner from "@/components/Common/PageTopBanner"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { useBackendStatus } from "@/stores/useBackendStatus"
import { emailPattern, handleError } from "@/utils"

interface FormData {
  email: string
}

export const Route = createFileRoute("/recover-password")({
  component: RecoverPassword,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/$productType",
        params: { productType: "fertilizer" },
      })
    }
  },
})

function RecoverPassword() {
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>()
  const { showSuccessToast } = useCustomToast()
  const recoverPassword = async (data: FormData) => {
    await LoginService.recoverPassword({
      path: { email: data.email },
    })
  }
  const mutation = useMutation({
    mutationFn: recoverPassword,
    onSuccess: () => {
      showSuccessToast(t("recoverPassword.success"))
      reset()
    },
    onError: (err: AxiosError) => {
      handleError(err)
    },
  })
  const onSubmit: SubmitHandler<FormData> = async (data) => {
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
            {t("recoverPassword.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t("recoverPassword.description")}
          </Typography>
        </Box>
        <TextField
          {...register("email", {
            required: t("recoverPassword.emailRequired"),
            pattern: {
              value: emailPattern.value,
              message: t("recoverPassword.emailInvalid"),
            },
          })}
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
