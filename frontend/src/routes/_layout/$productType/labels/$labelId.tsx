import { Container } from "@mui/material"
import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/$productType/labels/$labelId")({
  component: LabelDetail,
})

function LabelDetail() {
  return (
    <Container maxWidth="xl">
      <Outlet />
    </Container>
  )
}
