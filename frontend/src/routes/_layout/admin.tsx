// ============================== Admin ==============================

import PersonAddIcon from "@mui/icons-material/PersonAdd"
import { Box, Button, Container, Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import AdminUsersDataGrid from "#/components/Admin/AdminUsersDataGrid"
import AddUserDialog from "#/components/Common/AddUserDialog"
import { requireSuperuserOrRedirect } from "#/server/layout-guard"

export const Route = createFileRoute("/_layout/admin")({
  beforeLoad: ({ context }) => {
    requireSuperuserOrRedirect(context.user)
  },
  component: Admin,
})

function Admin() {
  const { t } = useTranslation("common")
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  useEffect(() => {
    document.title = t("admin.pageTitle")
  }, [t])
  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          py: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4">{t("admin.usersManagement")}</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setAddUserDialogOpen(true)}
        >
          {t("admin.user")}
        </Button>
      </Box>
      <AdminUsersDataGrid onAddUser={() => setAddUserDialogOpen(true)} />
      <AddUserDialog
        open={addUserDialogOpen}
        onClose={() => setAddUserDialogOpen(false)}
        onSuccess={() => setAddUserDialogOpen(false)}
      />
    </Container>
  )
}
