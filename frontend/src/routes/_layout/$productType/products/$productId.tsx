// ============================== Product detail ==============================
// --- GET /api/v1/products/{id} via server fn; loader + 404 ---

import { Box, Container, Paper, Typography } from "@mui/material"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { format } from "date-fns"
import { enCA, fr } from "date-fns/locale"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import NotFound from "#/components/Common/NotFound"
import { readProductByIdEditorFn } from "#/server/label-editor"
import { useLanguage } from "#/stores/useLanguage"

const VALID_PRODUCT_TYPES = ["fertilizer"] as const
const productDetailParamsSchema = z.object({
  productType: z.enum(VALID_PRODUCT_TYPES),
  productId: z.string().uuid(),
})

export const Route = createFileRoute(
  "/_layout/$productType/products/$productId",
)({
  notFoundComponent: NotFound,
  beforeLoad: ({ params }) => {
    if (!productDetailParamsSchema.safeParse(params).success) {
      throw notFound()
    }
  },
  loader: async ({ params }) => {
    const product = await readProductByIdEditorFn({
      data: { productId: params.productId },
    })
    if (!product) {
      throw notFound()
    }
    return { product }
  },
  component: ProductDetail,
})

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  const display = value?.trim() ? value : null
  return (
    <Box sx={{ py: 1.5, borderBottom: 1, borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" component="div">
        {label}
      </Typography>
      <Typography
        variant="body1"
        component="div"
        sx={{ wordBreak: "break-all" }}
      >
        {display ?? (
          <Box
            component="span"
            sx={{ color: "text.secondary", fontStyle: "italic" }}
          >
            —
          </Box>
        )}
      </Typography>
    </Box>
  )
}

function ProductDetail() {
  const { t } = useTranslation("products")
  const { product } = Route.useLoaderData()
  const { language } = useLanguage()
  useEffect(() => {
    document.title = t("detail.pageTitle")
  }, [t])
  const createdLabel = format(new Date(product.created_at), "PPP", {
    locale: language === "fr" ? fr : enCA,
  })
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {t("detail.title")}
        </Typography>
        <Paper sx={{ p: 3 }}>
          <DetailRow label={t("table.id")} value={product.id} />
          <DetailRow
            label={t("table.registrationNumber")}
            value={product.registration_number ?? null}
          />
          <DetailRow
            label={t("detail.brandEn")}
            value={product.brand_name_en ?? null}
          />
          <DetailRow
            label={t("detail.brandFr")}
            value={product.brand_name_fr ?? null}
          />
          <DetailRow
            label={t("detail.nameEn")}
            value={product.name_en ?? null}
          />
          <DetailRow
            label={t("detail.nameFr")}
            value={product.name_fr ?? null}
          />
          <DetailRow label={t("table.createdAt")} value={createdLabel} />
        </Paper>
      </Box>
    </Container>
  )
}
