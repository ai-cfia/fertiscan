import { Container, Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/_layout/$productType/verify")({
  component: Verify,
})

function Verify() {
  useEffect(() => {
    document.title = "Verify Labels - Label Inspection"
  }, [])
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ py: 3 }}>
        Verify Labels
      </Typography>
    </Container>
  )
}
