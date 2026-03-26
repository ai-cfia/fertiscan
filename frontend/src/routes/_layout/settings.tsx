// ============================== Settings ==============================

import { Container } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import UserSettingsContent from "#/components/Common/UserSettingsContent"

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const { t } = useTranslation("common")
  useEffect(() => {
    document.title = t("settings.pageTitle")
  }, [t])
  return (
    <Container maxWidth="xl">
      <UserSettingsContent showTitle={true} />
    </Container>
  )
}
