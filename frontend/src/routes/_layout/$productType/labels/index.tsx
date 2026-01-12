import { Container, Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/_layout/$productType/labels/")({
  component: Labels,
})

function Labels() {
  useEffect(() => {
    document.title = "Labels - Label Inspection"
  }, [])
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ py: 3 }}>
        Labels
      </Typography>
    </Container>
  )
}
