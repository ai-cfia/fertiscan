// ============================== User settings content ==============================

import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isRedirect } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import type { TFunction } from "i18next"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import EditUserDialog from "#/components/Common/EditUserDialog"
import { useSnackbar } from "#/components/SnackbarProvider"
import { useCurrentUser } from "#/hooks/use-current-user"
import { logoutFn } from "#/server/auth"
import { deleteUserMeFn, updatePasswordMeFn } from "#/server/user-me"
import { confirmPasswordRules, passwordRules } from "#/utils/form-validation"
import { getUserInitials } from "#/utils/user-display"

// ============================== Change Password Form ==============================
interface ChangePasswordFormData {
  current_password: string
  new_password: string
  confirm_new_password: string
}

interface ChangePasswordFormProps {
  t: TFunction<"common">
}

function ChangePasswordForm({ t }: ChangePasswordFormProps) {
  const { showSuccessToast } = useSnackbar()
  const runUpdatePassword = useServerFn(updatePasswordMeFn)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_new_password: "",
    },
  })
  const updateMutation = useMutation({
    mutationFn: (data: ChangePasswordFormData) =>
      runUpdatePassword({
        data: {
          current_password: data.current_password,
          new_password: data.new_password,
        },
      }),
    onSuccess: () => {
      showSuccessToast(t("settings.password.success"))
      setMutationError(null)
      reset()
    },
    onError: (error: unknown) => {
      const detail = error instanceof Error ? error.message : ""
      if (detail === "Incorrect password") {
        setMutationError(t("settings.password.incorrectPassword"))
      } else if (detail === "User has no password") {
        setMutationError(t("settings.password.userHasNoPassword"))
      } else if (detail) {
        setMutationError(detail)
      } else {
        setMutationError(t("settings.password.error"))
      }
    },
  })
  const onSubmit: SubmitHandler<ChangePasswordFormData> = async (data) => {
    setMutationError(null)
    try {
      await updateMutation.mutateAsync(data)
    } catch {
      /* onError sets mutationError */
    }
  }
  return (
    <Box>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}
      >
        <TextField
          {...register("current_password", {
            ...passwordRules(true, {
              required: t("settings.password.currentPasswordRequired"),
              minLength: t("settings.password.passwordMinLength"),
            }),
          })}
          label={t("settings.password.currentPassword")}
          type={showCurrentPassword ? "text" : "password"}
          fullWidth
          required
          autoComplete="current-password"
          error={!!errors.current_password || !!mutationError}
          helperText={
            errors.current_password?.message ||
            (mutationError
              ? mutationError
              : t("settings.password.passwordHelper"))
          }
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t("aria.togglePasswordVisibility")}
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          {...register(
            "new_password",
            passwordRules(true, {
              required: t("settings.password.newPasswordRequired"),
              minLength: t("settings.password.passwordMinLength"),
            }),
          )}
          label={t("settings.password.newPassword")}
          type={showNewPassword ? "text" : "password"}
          fullWidth
          required
          autoComplete="new-password"
          error={!!errors.new_password}
          helperText={
            errors.new_password?.message ||
            t("settings.password.passwordHelper")
          }
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t("aria.togglePasswordVisibility")}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          {...register(
            "confirm_new_password",
            confirmPasswordRules(getValues, true, {
              required: t("settings.password.confirmNewPasswordRequired"),
              validate: t("settings.password.passwordsDoNotMatch"),
            }),
          )}
          label={t("settings.password.confirmNewPassword")}
          type={showConfirmNewPassword ? "text" : "password"}
          fullWidth
          required
          autoComplete="new-password"
          error={!!errors.confirm_new_password}
          helperText={
            errors.confirm_new_password?.message ||
            t("settings.password.confirmPasswordHelper")
          }
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t("aria.togglePasswordVisibility")}
                    onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showConfirmNewPassword ? (
                      <VisibilityOff />
                    ) : (
                      <Visibility />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || updateMutation.isPending}
          sx={{ alignSelf: "flex-start" }}
        >
          {updateMutation.isPending ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            t("settings.password.submit")
          )}
        </Button>
      </Box>
    </Box>
  )
}

// ============================== Danger Zone ==============================
interface DangerZoneProps {
  t: TFunction<"common">
}

function DangerZone({ t }: DangerZoneProps) {
  const queryClient = useQueryClient()
  const { showErrorToast, showSuccessToast } = useSnackbar()
  const runDeleteUserMe = useServerFn(deleteUserMeFn)
  const runLogout = useServerFn(logoutFn)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const deleteMutation = useMutation({
    mutationFn: () => runDeleteUserMe(),
    onSuccess: async () => {
      setDeleteDialogOpen(false)
      showSuccessToast(t("settings.dangerZone.deleteAccountSuccess"))
      queryClient.removeQueries({ queryKey: ["currentUser"] })
      try {
        await runLogout()
      } catch (e) {
        if (isRedirect(e)) throw e
      }
    },
    onError: (error: unknown) => {
      const detail = error instanceof Error ? error.message : ""
      showErrorToast(detail || t("admin.rowActions.deleteError"))
    },
  })
  return (
    <Box sx={{ maxWidth: 400 }}>
      <Box
        sx={{
          border: 1,
          borderColor: "error.main",
          borderRadius: 1,
          p: 2,
        }}
      >
        <Typography
          variant="subtitle1"
          color="error.main"
          sx={{ fontWeight: 600 }}
        >
          {t("settings.dangerZone.deleteAccount")}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 2 }}
        >
          {t("settings.dangerZone.deleteAccountDescription")}
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={deleteMutation.isPending}
        >
          {t("settings.dangerZone.deleteAccountButton")}
        </Button>
      </Box>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteMutation.isPending && setDeleteDialogOpen(false)}
        aria-labelledby="delete-account-dialog-title"
        aria-describedby="delete-account-dialog-description"
      >
        <DialogTitle id="delete-account-dialog-title">
          {t("settings.dangerZone.deleteAccountDialogTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-account-dialog-description">
            {t("settings.dangerZone.deleteAccountDialogDescription")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteMutation.isPending}
          >
            {t("button.cancel")}
          </Button>
          <Button
            onClick={() => deleteMutation.mutate()}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t("settings.dangerZone.deleteAccountButton")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ============================== User Settings Content ==============================
interface UserSettingsContentProps {
  showTitle?: boolean
}

export default function UserSettingsContent({
  showTitle = true,
}: UserSettingsContentProps) {
  const { t } = useTranslation("common")
  const { data: currentUser, isPending } = useCurrentUser()
  const [value, setValue] = useState(0)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  if (isPending && !currentUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (!currentUser) {
    return null
  }
  const fullName =
    [currentUser.first_name, currentUser.last_name].filter(Boolean).join(" ") ||
    "—"
  return (
    <Box>
      {showTitle && (
        <Typography variant="h4" sx={{ py: 3 }}>
          {t("settings.title")}
        </Typography>
      )}
      <Tabs value={value} onChange={handleChange}>
        <Tab label={t("settings.tabs.myProfile")} />
        <Tab label={t("settings.tabs.password")} />
        <Tab label={t("settings.tabs.appearance")} />
        <Tab label={t("settings.tabs.dangerZone")} />
      </Tabs>
      <Box sx={{ mt: 3 }}>
        {value === 0 && (
          <Box>
            <List dense disablePadding>
              <ListItem disablePadding sx={{ mb: 1, alignItems: "center" }}>
                <ListItemAvatar>
                  <Avatar>{getUserInitials(currentUser)}</Avatar>
                </ListItemAvatar>
                <Box>
                  <Typography variant="h6">{fullName}</Typography>
                  <Typography variant="body1" color="text.secondary">
                    {currentUser.is_superuser
                      ? t("admin.table.superuser")
                      : t("admin.table.user")}
                  </Typography>
                </Box>
              </ListItem>
              <ListItem disablePadding>
                <ListItemText
                  primary={t("settings.profile.email")}
                  secondary={currentUser.email}
                  slotProps={{
                    primary: { variant: "body1" },
                    secondary: { variant: "body1" },
                  }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemText
                  primary={t("settings.profile.status")}
                  secondary={
                    currentUser.is_active
                      ? t("admin.table.active")
                      : t("admin.table.inactive")
                  }
                  slotProps={{
                    primary: { variant: "body1" },
                    secondary: { variant: "body1" },
                  }}
                />
              </ListItem>
            </List>
            <Divider sx={{ my: 2 }} />
            <Button variant="contained" onClick={() => setEditDialogOpen(true)}>
              {t("settings.profile.edit")}
            </Button>
          </Box>
        )}
        {value === 1 && <ChangePasswordForm t={t} />}
        {value === 2 && (
          <Typography variant="body1">
            {t("settings.sections.appearance")}
          </Typography>
        )}
        {value === 3 && <DangerZone t={t} />}
      </Box>
      <EditUserDialog
        open={editDialogOpen}
        user={currentUser}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={() => setEditDialogOpen(false)}
        isSelfEdit
      />
    </Box>
  )
}
