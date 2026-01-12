import { Box, Container, Grid, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { LabelsService, ProductsService } from "@/api"
import ActionButton from "@/components/Common/ActionButton"
import StatCard from "@/components/Common/StatCard"

export const Route = createFileRoute("/_layout/$productType/")({
  component: Dashboard,
})

function Dashboard() {
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
  const {
    data: labelsPendingVerification,
    isLoading: isLoadingPendingVerification,
  } = useQuery({
    queryKey: ["labels", "pending-verification", productType],
    queryFn: async () => {
      const response = await LabelsService.readLabels({
        query: {
          product_type: productType,
          verification_status: "not_started",
          limit: 1,
        },
      })
      return response.data
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
  const { data: labelsExtracting, isLoading: isLoadingExtracting } = useQuery({
    queryKey: ["labels", "in-progress", productType],
    queryFn: async () => {
      const response = await LabelsService.readLabels({
        query: {
          product_type: productType,
          extraction_status: "in_progress",
          limit: 1,
        },
      })
      return response.data
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
  const { data: labelsFailedExtraction, isLoading: isLoadingFailedExtraction } =
    useQuery({
      queryKey: ["labels", "failed-extraction", productType],
      queryFn: async () => {
        const response = await LabelsService.readLabels({
          query: {
            product_type: productType,
            extraction_status: "failed",
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
    document.title = "Dashboard - Label Inspection"
  }, [])
  return (
    <Container maxWidth="xl">
      <Box sx={{ pt: 3, pb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* ============================== Overview ============================== */}
          <Box component="section">
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Overview
            </Typography>
            {/* ------------------------------ Stat Cards ------------------------------ */}
            <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label="Total Labels"
                  value={totalLabels?.total ?? 0}
                  isLoading={isLoadingTotalLabels}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label="Pending Verification"
                  value={labelsPendingVerification?.total ?? 0}
                  isLoading={isLoadingPendingVerification}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/verify",
                      params: { productType },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label="Extracting"
                  value={labelsExtracting?.total ?? 0}
                  isLoading={isLoadingExtracting}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: { status: "in_progress" },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label="Failed Extractions"
                  value={labelsFailedExtraction?.total ?? 0}
                  isLoading={isLoadingFailedExtraction}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: { status: "failed" },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label="Total Products"
                  value={totalProducts?.total ?? 0}
                  isLoading={isLoadingTotalProducts}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/products",
                      params: { productType },
                    })
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <StatCard
                  label="Unlinked Labels"
                  value={unlinkedLabels?.total ?? 0}
                  supportingText="Labels not associated with products"
                  isLoading={isLoadingUnlinkedLabels}
                  onViewAll={() => {
                    navigate({
                      to: "/$productType/labels",
                      params: { productType },
                      search: { unlinked: true },
                    })
                  }}
                />
              </Grid>
            </Grid>
          </Box>
          {/* ============================== Quick Actions ============================== */}
          <Box component="section">
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            {/* ------------------------------ Action Buttons ------------------------------ */}
            <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <ActionButton
                  title="Create New Label"
                  description="Upload and process a new label"
                  to={`/${productType}/labels/new`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <ActionButton
                  title="View All Labels"
                  description="Browse and manage all labels"
                  to={`/${productType}/labels`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <ActionButton
                  title="Manage Products"
                  description="View and edit products"
                  to={`/${productType}/products`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <ActionButton
                  title="Verify Labels"
                  description="Review labels ready for verification"
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
