// ============================== Product home (dashboard) ==============================

import { Box, Container, Grid, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import ActionButton from "#/components/Common/ActionButton"
import StatCard from "#/components/Common/StatCard"
import { getDashboardStatsFn } from "#/server/dashboard-stats"
import { useConfig } from "#/stores/useConfig"

export const Route = createFileRoute("/_layout/$productType/")({
  component: Dashboard,
})

function Dashboard() {
  const { t } = useTranslation("labels")
  const { defaultPerPage } = useConfig()
  const { productType } = Route.useParams()
  const navigate = useNavigate()
  const fetchStats = useServerFn(getDashboardStatsFn)
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats", productType],
    queryFn: () => fetchStats({ data: { productType } }),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
  useEffect(() => {
    document.title = t("dashboard.title")
  }, [t])
  return (
    <Container maxWidth="xl">
      <Box sx={{ pt: 3, pb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box component="section">
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              {t("dashboard.overview")}
            </Typography>
            <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label={t("dashboard.totalLabels")}
                  value={stats?.totalLabels ?? 0}
                  isLoading={isLoading}
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
                  value={stats?.notStarted ?? 0}
                  isLoading={isLoading}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: {
                        page: 0,
                        per_page: defaultPerPage,
                        review_status: "not_started",
                      },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label={t("dashboard.inProgress")}
                  value={stats?.inProgress ?? 0}
                  isLoading={isLoading}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: {
                        page: 0,
                        per_page: defaultPerPage,
                        review_status: "in_progress",
                      },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label={t("dashboard.completed")}
                  value={stats?.completed ?? 0}
                  isLoading={isLoading}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: {
                        page: 0,
                        per_page: defaultPerPage,
                        review_status: "completed",
                      },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label={t("dashboard.totalProducts")}
                  value={stats?.totalProducts ?? 0}
                  isLoading={isLoading}
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
                  value={stats?.unlinkedLabels ?? 0}
                  isLoading={isLoading}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: {
                        page: 0,
                        per_page: defaultPerPage,
                        unlinked: true,
                      },
                    })
                  }}
                />
              </Grid>
            </Grid>
          </Box>
          <Box component="section">
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              {t("dashboard.quickActions")}
            </Typography>
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
            </Grid>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
