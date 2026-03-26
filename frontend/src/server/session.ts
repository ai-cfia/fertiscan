// ============================== Server session ==============================
// --- Encrypted cookie session (TanStack Start) ---

import { useSession } from "@tanstack/react-start/server"

export type AppSessionData = {
  accessToken?: string
}

export async function getAppSession() {
  const password = process.env.SESSION_SECRET
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters")
  }
  // biome-ignore lint/correctness/useHookAtTopLevel: TanStack Start server session API, not a React hook
  return useSession<AppSessionData>({
    name: "fertiscan-session",
    password,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    },
  })
}
