// ============================== Current user (server session) ==============================

import { useQuery } from "@tanstack/react-query"
import { getCurrentUserFn } from "#/server/auth"

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUserFn(),
  })
}
