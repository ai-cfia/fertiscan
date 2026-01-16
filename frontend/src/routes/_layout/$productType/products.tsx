import { Container, Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/_layout/$productType/products")({
  component: Products,
})

function Products() {
  const { t } = useTranslation("common")
  useEffect(() => {
    document.title = t("products.pageTitle")
  }, [t])
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ py: 3 }}>
        {t("products.title")}
      </Typography>
    </Container>
  )
}
