import { Box, Container, Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute(
  "/_layout/$productType/products/$productId",
)({
  component: ProductDetailsStub,
})

function ProductDetailsStub() {
  const { productId } = Route.useParams()

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4">Product Details (Stub)</Typography>
        <Typography variant="body1">Product ID: {productId}</Typography>
        <Typography variant="body2" color="text.secondary">
          Full details implementation coming soon.
        </Typography>
      </Box>
    </Container>
  )
}
