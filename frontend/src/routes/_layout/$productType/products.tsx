import AddIcon from "@mui/icons-material/Add"
import { Box, Button, Container, Typography } from "@mui/material"
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/_layout/$productType/products")({
  component: Products,
})

function Products() {
  const { t } = useTranslation("common")
  const location = useLocation()
  const { productType } = Route.useParams()
  useEffect(() => {
    if (location.pathname === `/${productType}/products`) {
      document.title = t("products.pageTitle")
    }
  }, [t, location.pathname, productType])
  const isExactPath = location.pathname === `/${productType}/products`
  return (
    <>
      {isExactPath && (
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 3,
            }}
          >
            <Typography variant="h4">{t("products.title")}</Typography>
            <Button
              component={Link}
              to={`/${productType}/products/new`}
              variant="contained"
              startIcon={<AddIcon />}
            >
              {t("products.createNew")}
            </Button>
          </Box>
        </Container>
      )}
      <Outlet />
    </>
  )
}
