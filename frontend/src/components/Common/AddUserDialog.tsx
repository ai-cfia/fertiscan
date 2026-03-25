// ============================== Add user dialog ==============================

import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
} from "@mui/material"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { useEffect, useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UserCreateWritable } from "#/api"
import { useSnackbar } from "#/components/SnackbarProvider"
import { createAdminUserFn } from "#/server/admin-users"
import {
  confirmPasswordRules,
  emailPattern,
  passwordRules,
} from "#/utils/form-validation"

interface AddUserForm extends UserCreateWritable {
  confirm_password: string
}

interface AddUserDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddUserDialog({
  open,
  onClose,
  onSuccess,
}: AddUserDialogProps) {
  const { t } = useTranslation("common")
  const { showSuccessToast } = useSnackbar()
  const queryClient = useQueryClient()
  const runCreateUser = useServerFn(createAdminUserFn)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AddUserForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      first_name: "",
      last_name: "",
      is_active: true,
      is_superuser: false,
    },
  })
  useEffect(() => {
    if (open) {
      setMutationError(null)
      setShowPassword(false)
      setShowConfirmPassword(false)
      reset({
        email: "",
        password: "",
        confirm_password: "",
        first_name: "",
        last_name: "",
        is_active: true,
        is_superuser: false,
      })
    }
  }, [open, reset])
  const createMutation = useMutation({
    mutationFn: async (form: AddUserForm) => {
      const { confirm_password: _cp, ...body } = form
      await runCreateUser({
        data: {
          email: body.email,
          password: body.password,
          first_name: body.first_name || null,
          last_name: body.last_name || null,
          is_active: body.is_active ?? true,
          is_superuser: body.is_superuser ?? false,
        },
      })
    },
    onSuccess: () => {
      onClose()
      showSuccessToast(t("admin.addUserDialog.success"))
      queryClient.invalidateQueries({ queryKey: ["users"] })
      onSuccess?.()
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : ""
      setMutationError(msg || t("admin.addUserDialog.error"))
    },
  })
  const onSubmit: SubmitHandler<AddUserForm> = async (data) => {
    setMutationError(null)
    try {
      await createMutation.mutateAsync(data)
    } catch {
      /* onError */
    }
  }
  const handleClose = () => {
    if (!createMutation.isPending) onClose()
  }
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="add-user-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="add-user-dialog-title">
        {t("admin.addUserDialog.title")}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="add-user-form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <TextField
            {...register("email", {
              required: t("admin.addUserDialog.emailRequired"),
              pattern: {
                ...emailPattern,
                message: t("admin.addUserDialog.emailInvalid"),
              },
              maxLength: {
                value: 255,
                message: t("admin.addUserDialog.emailMaxLength"),
              },
            })}
            label={t("admin.table.email")}
            type="email"
            fullWidth
            required
            error={!!errors.email || !!mutationError}
            helperText={
              errors.email?.message ||
              (mutationError
                ? mutationError
                : t("admin.addUserDialog.emailHelper"))
            }
          />
          <TextField
            {...register(
              "password",
              passwordRules(true, {
                required: t("admin.addUserDialog.passwordRequired"),
                minLength: t("admin.addUserDialog.passwordMinLength"),
              }),
            )}
            label={t("admin.addUserDialog.password")}
            type={showPassword ? "text" : "password"}
            fullWidth
            required
            error={!!errors.password}
            helperText={
              errors.password?.message ||
              t("admin.addUserDialog.passwordHelper")
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t("aria.togglePasswordVisibility")}
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
                required: t("admin.addUserDialog.confirmPasswordRequired"),
                validate: t("admin.addUserDialog.passwordsDoNotMatch"),
              }),
            )}
            label={t("admin.addUserDialog.confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            fullWidth
            required
            error={!!errors.confirm_password}
            helperText={
              errors.confirm_password?.message ||
              t("admin.addUserDialog.confirmPasswordHelper")
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t("aria.togglePasswordVisibility")}
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
          <TextField
            {...register("first_name", {
              maxLength: {
                value: 255,
                message: t("admin.rowActions.editDialog.firstNameMaxLength"),
              },
            })}
            label={t("admin.rowActions.editDialog.firstName")}
            fullWidth
            error={!!errors.first_name}
            helperText={
              errors.first_name?.message ||
              t("admin.rowActions.editDialog.firstNameHelper")
            }
          />
          <TextField
            {...register("last_name", {
              maxLength: {
                value: 255,
                message: t("admin.rowActions.editDialog.lastNameMaxLength"),
              },
            })}
            label={t("admin.rowActions.editDialog.lastName")}
            fullWidth
            error={!!errors.last_name}
            helperText={
              errors.last_name?.message ||
              t("admin.rowActions.editDialog.lastNameHelper")
            }
          />
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    onBlur={field.onBlur}
                  />
                }
                label={t("admin.rowActions.editDialog.active")}
              />
            )}
          />
          <Controller
            name="is_superuser"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    onBlur={field.onBlur}
                  />
                }
                label={t("admin.rowActions.editDialog.superuser")}
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={createMutation.isPending}>
          {t("button.cancel")}
        </Button>
        <Button
          type="submit"
          form="add-user-form"
          variant="contained"
          disabled={isSubmitting || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            t("admin.addUserDialog.submit")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
