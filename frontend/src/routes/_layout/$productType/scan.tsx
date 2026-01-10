import { Container, Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/_layout/$productType/scan")({
  component: Scan,
})

function Scan() {
  useEffect(() => {
    document.title = "Scan New Label - Label Inspection"
  }, [])
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ py: 3 }}>
        Scan New Label
      </Typography>
    </Container>
  )
}
