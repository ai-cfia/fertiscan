// ============================== Edit user dialog ==============================

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { useEffect, useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UserPublic } from "#/api"
import { useSnackbar } from "#/components/SnackbarProvider"
import { updateUserByIdFn, updateUserMeFn } from "#/server/user-me"
import { emailPattern } from "#/utils/form-validation"

interface EditUserForm {
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_superuser: boolean
}

interface EditUserDialogProps {
  open: boolean
  user: UserPublic
  onClose: () => void
  onSuccess?: () => void
  isSelfEdit?: boolean
}

export default function EditUserDialog({
  open,
  user,
  onClose,
  onSuccess,
  isSelfEdit = false,
}: EditUserDialogProps) {
  const { t } = useTranslation("common")
  const { showSuccessToast } = useSnackbar()
  const queryClient = useQueryClient()
  const runUpdateMe = useServerFn(updateUserMeFn)
  const runUpdateUser = useServerFn(updateUserByIdFn)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: user.email,
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      is_active: user.is_active ?? true,
      is_superuser: user.is_superuser ?? false,
    },
  })
  useEffect(() => {
    if (open) {
      setMutationError(null)
      reset({
        email: user.email,
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        is_active: user.is_active ?? true,
        is_superuser: user.is_superuser ?? false,
      })
    }
  }, [open, user, reset])
  const updateMutation = useMutation({
    mutationFn: async (data: EditUserForm) => {
      if (isSelfEdit) {
        await runUpdateMe({
          data: {
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
          },
        })
      } else {
        await runUpdateUser({
          data: {
            userId: user.id,
            body: {
              email: data.email || null,
              first_name: data.first_name || null,
              last_name: data.last_name || null,
              is_active: data.is_active,
              is_superuser: data.is_superuser,
            },
          },
        })
      }
    },
    onSuccess: () => {
      onClose()
      showSuccessToast(t("admin.rowActions.editDialog.success"))
      if (!isSelfEdit) {
        queryClient.invalidateQueries({ queryKey: ["users"] })
      }
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      onSuccess?.()
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : ""
      setMutationError(msg || t("admin.rowActions.editDialog.error"))
    },
  })
  const onSubmit: SubmitHandler<EditUserForm> = async (data) => {
    setMutationError(null)
    try {
      await updateMutation.mutateAsync(data)
    } catch {
      /* mutation onError sets mutationError */
    }
  }
  const handleClose = () => {
    if (!updateMutation.isPending) onClose()
  }
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-user-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="edit-user-dialog-title">
        {t("admin.rowActions.editDialog.title")}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="edit-user-form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <TextField
            {...register("email", {
              required: t("admin.rowActions.editDialog.emailRequired"),
              pattern: {
                ...emailPattern,
                message: t("admin.rowActions.editDialog.emailInvalid"),
              },
              maxLength: {
                value: 255,
                message: t("admin.rowActions.editDialog.emailMaxLength"),
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
                : t("admin.rowActions.editDialog.emailHelper"))
            }
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
          {!isSelfEdit && (
            <>
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
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateMutation.isPending}>
          {t("button.cancel")}
        </Button>
        <Button
          type="submit"
          form="edit-user-form"
          variant="contained"
          disabled={isSubmitting || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            t("button.save")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
