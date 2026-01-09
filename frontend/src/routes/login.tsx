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
import type { BodyLoginLoginAccessToken as AccessToken } from "@/client"
import BackendStatusBanner from "@/components/Common/BackendStatusBanner"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { emailPattern, passwordRules } from "@/utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function Login() {
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
            Login
          </Typography>
        </Box>
        <TextField
          {...register("username", {
            required: "Username is required",
            pattern: emailPattern,
          })}
          label="Email"
          type="email"
          fullWidth
          error={!!errors.username || !!error}
          helperText={errors.username?.message || (error ? "Login failed" : "")}
          InputProps={{
            startAdornment: (
              <EmailIcon sx={{ mr: 1, color: "action.active" }} />
            ),
          }}
        />
        <TextField
          {...register("password", passwordRules())}
          label="Password"
          type="password"
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon />
              </InputAdornment>
            ),
          }}
        />
        <Link component={RouterLink} to="/recover-password" underline="hover">
          Forgot Password?
        </Link>
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting}
          fullWidth
          size="large"
        >
          {isSubmitting ? "Logging in..." : "Log In"}
        </Button>
        <Typography textAlign="center">
          Don't have an account?{" "}
          <Link component={RouterLink} to="/signup" underline="hover">
            Sign Up
          </Link>
        </Typography>
      </Container>
    </>
  )
}
