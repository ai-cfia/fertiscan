import { Box, Container, Tab, Tabs, Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const { t } = useTranslation("common")
  const { user: currentUser } = useAuth()
  const [value, setValue] = useState(0)
  useEffect(() => {
    document.title = t("settings.pageTitle")
  }, [t])
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  if (!currentUser) {
    return null
  }
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ py: 3 }}>
        {t("settings.title")}
      </Typography>
      <Tabs value={value} onChange={handleChange}>
        <Tab label={t("settings.tabs.myProfile")} />
        {!currentUser.is_superuser && (
          <Tab label={t("settings.tabs.password")} />
        )}
        {!currentUser.is_superuser && (
          <Tab label={t("settings.tabs.appearance")} />
        )}
        {!currentUser.is_superuser && (
          <Tab label={t("settings.tabs.dangerZone")} />
        )}
      </Tabs>
      <Box sx={{ mt: 3 }}>
        {value === 0 && (
          <Typography variant="body1">
            {t("settings.sections.userInformation")}
          </Typography>
        )}
        {value === 1 && !currentUser.is_superuser && (
          <Typography variant="body1">
            {t("settings.sections.changePassword")}
          </Typography>
        )}
        {value === 2 && !currentUser.is_superuser && (
          <Typography variant="body1">
            {t("settings.sections.appearance")}
          </Typography>
        )}
        {value === 3 && !currentUser.is_superuser && (
          <Typography variant="body1">
            {t("settings.sections.deleteAccount")}
          </Typography>
        )}
      </Box>
    </Container>
  )
}
