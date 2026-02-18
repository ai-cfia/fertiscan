import { Box, Container, Grid, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { LabelsService, ProductsService } from "@/api"
import ActionButton from "@/components/Common/ActionButton"
import StatCard from "@/components/Common/StatCard"
import { useConfig } from "@/stores/useConfig"

export const Route = createFileRoute("/_layout/$productType/")({
  component: Dashboard,
})

function Dashboard() {
  const { t } = useTranslation("labels")
  const { defaultPerPage } = useConfig()
  // ============================== Route & Navigation ==============================
  const { productType } = Route.useParams()
  const navigate = useNavigate()
  // ============================== Data Fetching ==============================
  const { data: totalLabels, isLoading: isLoadingTotalLabels } = useQuery({
    queryKey: ["labels", "total", productType],
    queryFn: async () => {
      const response = await LabelsService.readLabels({
        query: { product_type: productType, limit: 1 },
      })
      return response.data
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
  const { data: labelsNotStarted, isLoading: isLoadingNotStarted } = useQuery({
    queryKey: ["labels", "not-started", productType],
    queryFn: async () => {
      const response = await LabelsService.readLabels({
        query: {
          product_type: productType,
          review_status: "not_started",
          limit: 1,
        },
      })
      return response.data
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
  const { data: labelsInProgress, isLoading: isLoadingInProgress } = useQuery({
    queryKey: ["labels", "in-progress", productType],
    queryFn: async () => {
      const response = await LabelsService.readLabels({
        query: {
          product_type: productType,
          review_status: "in_progress",
          limit: 1,
        },
      })
      return response.data
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
  const { data: labelsCompleted, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ["labels", "completed", productType],
    queryFn: async () => {
      const response = await LabelsService.readLabels({
        query: {
          product_type: productType,
          review_status: "completed",
          limit: 1,
        },
      })
      return response.data
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
  const { data: totalProducts, isLoading: isLoadingTotalProducts } = useQuery({
    queryKey: ["products", "total", productType],
    queryFn: async () => {
      const response = await ProductsService.readProducts({
        query: { product_type: productType, limit: 1 },
      })
      return response.data
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
  const { data: unlinkedLabels, isLoading: isLoadingUnlinkedLabels } = useQuery(
    {
      queryKey: ["labels", "unlinked", productType],
      queryFn: async () => {
        const response = await LabelsService.readLabels({
          query: { product_type: productType, unlinked: true, limit: 1 },
        })
        return response.data
      },
      refetchInterval: 5000,
      refetchIntervalInBackground: false,
    },
  )
  // ============================== Effects ==============================
  useEffect(() => {
    document.title = t("dashboard.title")
  }, [t])
  return (
    <Container maxWidth="xl">
      <Box sx={{ pt: 3, pb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* ============================== Overview ============================== */}
          <Box component="section">
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              {t("dashboard.overview")}
            </Typography>
            {/* ------------------------------ Stat Cards ------------------------------ */}
            <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label={t("dashboard.totalLabels")}
                  value={totalLabels?.total ?? 0}
                  isLoading={isLoadingTotalLabels}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: { page: 0, per_page: defaultPerPage },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label={t("dashboard.notStarted")}
                  value={labelsNotStarted?.total ?? 0}
                  isLoading={isLoadingNotStarted}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: {
                        page: 0,
                        per_page: 10,
                        review_status: "not_started",
                      },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label={t("dashboard.inProgress")}
                  value={labelsInProgress?.total ?? 0}
                  isLoading={isLoadingInProgress}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: {
                        page: 0,
                        per_page: 10,
                        review_status: "in_progress",
                      },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label={t("dashboard.completed")}
                  value={labelsCompleted?.total ?? 0}
                  isLoading={isLoadingCompleted}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: {
                        page: 0,
                        per_page: 10,
                        review_status: "completed",
                      },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label={t("dashboard.totalProducts")}
                  value={totalProducts?.total ?? 0}
                  isLoading={isLoadingTotalProducts}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/products",
                      params: { productType },
                      search: { page: 0, per_page: defaultPerPage },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label={t("dashboard.unlinkedLabels")}
                  supportingText={t("dashboard.unlinkedLabelsDescription")}
                  value={unlinkedLabels?.total ?? 0}
                  isLoading={isLoadingUnlinkedLabels}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: { page: 0, per_page: 10, unlinked: true },
                    })
                  }}
                />
              </Grid>
            </Grid>
          </Box>
          {/* ============================== Quick Actions ============================== */}
          <Box component="section">
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              {t("dashboard.quickActions")}
            </Typography>
            {/* ------------------------------ Action Buttons ------------------------------ */}
            <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <ActionButton
                  title={t("dashboard.createNewLabel")}
                  description={t("dashboard.createNewLabelDescription")}
                  to={`/${productType}/labels/new`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <ActionButton
                  title={t("dashboard.viewAllLabels")}
                  description={t("dashboard.viewAllLabelsDescription")}
                  to={`/${productType}/labels`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <ActionButton
                  title={t("dashboard.manageProducts")}
                  description={t("dashboard.manageProductsDescription")}
                  to={`/${productType}/products`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <ActionButton
                  title={t("dashboard.verifyLabels")}
                  description={t("dashboard.verifyLabelsDescription")}
                  to={`/${productType}/verify`}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
