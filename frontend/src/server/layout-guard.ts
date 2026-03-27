// ============================== Layout route guards ==============================
// --- Shared beforeLoad rules (middleware-ready) ---

import { redirect } from "@tanstack/react-router"
import type { UserPublic } from "#/api/types.gen"
import { getCurrentUserFn } from "#/server/auth"

export async function requireAuthedUserForLayout(
  locationHref: string,
): Promise<{
  user: UserPublic
}> {
  const user = await getCurrentUserFn()
  if (!user) {
    throw redirect({
      to: "/login",
      search: { redirect: locationHref },
    })
  }
  return { user }
}

export function requireSuperuserOrRedirect(user: UserPublic): void {
  if (!user.is_superuser) {
    throw redirect({
      to: "/$productType",
      params: { productType: "fertilizer" },
    })
  }
}
