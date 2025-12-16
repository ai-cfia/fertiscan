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
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import type { PrivateUserCreate } from "@/client"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { confirmPasswordRules, emailPattern, passwordRules } from "@/utils"

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

interface UserRegisterForm extends PrivateUserCreate {
  confirm_password: string
}

function SignUp() {
  const { signUpMutation } = useAuth()
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
          Sign Up
        </Typography>
      </Box>
      <TextField
        {...register("first_name", {
          required: "First Name is required",
        })}
        label="First Name"
        type="text"
        fullWidth
        error={!!errors.first_name}
        helperText={errors.first_name?.message}
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
          required: "Last Name is required",
        })}
        label="Last Name"
        type="text"
        fullWidth
        error={!!errors.last_name}
        helperText={errors.last_name?.message}
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
          required: "Email is required",
          pattern: emailPattern,
        })}
        label="Email"
        type="email"
        fullWidth
        error={!!errors.email}
        helperText={errors.email?.message}
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
        {...register("password", passwordRules())}
        label="Password"
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
      <TextField
        {...register("confirm_password", confirmPasswordRules(getValues))}
        label="Confirm Password"
        type="password"
        fullWidth
        error={!!errors.confirm_password}
        helperText={errors.confirm_password?.message}
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
        {isSubmitting ? "Signing up..." : "Sign Up"}
      </Button>
      <Typography textAlign="center">
        Already have an account?{" "}
        <Link component={RouterLink} to="/login" underline="hover">
          Log In
        </Link>
      </Typography>
    </Container>
  )
}
