import { Container, Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/_layout/$productType/verify")({
  component: Verify,
})

function Verify() {
  const { t } = useTranslation("labels")
  useEffect(() => {
    document.title = t("dashboard.verifyPageTitle")
  }, [t])
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ py: 3 }}>
        {t("dashboard.verifyLabels")}
      </Typography>
    </Container>
  )
}
