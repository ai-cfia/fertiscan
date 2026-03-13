import { createRootRoute, Outlet } from "@tanstack/react-router"
import React, { Suspense } from "react"
import NotFound from "@/components/Common/NotFound"
import { useBackendHealthCheck } from "@/hooks/useBackendHealthCheck"

const loadDevtools = () =>
  Promise.all([
    import("@tanstack/react-router-devtools"),
    import("@tanstack/react-query-devtools"),
  ]).then(([routerDevtools, reactQueryDevtools]) => {
    return {
      default: () => (
        <>
          <routerDevtools.TanStackRouterDevtools />
          <reactQueryDevtools.ReactQueryDevtools />
        </>
      ),
    }
  })

const TanStackDevtools = import.meta.env.PROD
  ? () => null
  : React.lazy(loadDevtools)

export const Route = createRootRoute({
  component: () => {
    useBackendHealthCheck()

    return (
      <>
        <Outlet />
        <Suspense>
          <TanStackDevtools />
        </Suspense>
      </>
    )
  },
  notFoundComponent: () => <NotFound />,
})
