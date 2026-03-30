// ============================== Label detail layout ==============================

import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/$productType/labels/$labelId")({
  component: LabelDetailLayout,
})

function LabelDetailLayout() {
  return <Outlet />
}
