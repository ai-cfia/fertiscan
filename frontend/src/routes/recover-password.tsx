import EmailIcon from "@mui/icons-material/Email"
import {
  Box,
  Button,
  Container,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import type { AxiosError } from "axios"
import { type SubmitHandler, useForm } from "react-hook-form"
import { LoginService } from "@/api"
import BackendStatusBanner from "@/components/Common/BackendStatusBanner"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
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
      showSuccessToast("Password recovery email sent successfully.")
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
            Password Recovery
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            A password recovery email will be sent to the registered account.
          </Typography>
        </Box>
        <TextField
          {...register("email", {
            required: "Email is required",
            pattern: emailPattern,
          })}
          label="Email"
          type="email"
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting}
          fullWidth
          size="large"
        >
          {isSubmitting ? "Sending..." : "Continue"}
        </Button>
      </Container>
    </>
  )
}
