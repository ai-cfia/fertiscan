import { Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute(
  "/_layout/$productType/labels/$labelId/data",
)({
  component: LabelData,
})

function LabelData() {
  return <Typography>Data view/edit (placeholder)</Typography>
}
