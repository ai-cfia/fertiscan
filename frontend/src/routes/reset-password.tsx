import LockIcon from "@mui/icons-material/Lock"
import {
  Box,
  Button,
  Container,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import type { AxiosError } from "axios"
import { type SubmitHandler, useForm } from "react-hook-form"
import { LoginService, type NewPassword } from "@/api"
import BackendStatusBanner from "@/components/Common/BackendStatusBanner"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "@/utils"

interface NewPasswordForm extends NewPassword {
  confirm_password: string
}

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function ResetPassword() {
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
  const resetPassword = async (data: NewPassword) => {
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) return
    await LoginService.resetPassword({
      body: { new_password: data.new_password, token: token },
    })
  }
  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      showSuccessToast("Password updated successfully.")
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
            Reset Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please enter your new password and confirm it to reset your
            password.
          </Typography>
        </Box>
        <TextField
          {...register("new_password", passwordRules())}
          label="New Password"
          type="password"
          fullWidth
          error={!!errors.new_password}
          helperText={errors.new_password?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          {...register("confirm_password", confirmPasswordRules(getValues))}
          label="Confirm Password"
          type="password"
          fullWidth
          error={!!errors.confirm_password}
          helperText={errors.confirm_password?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" type="submit" fullWidth size="large">
          Reset Password
        </Button>
      </Container>
    </>
  )
}
