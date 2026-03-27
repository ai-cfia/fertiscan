// ============================== Server env ==============================

export function getServerApiUrl(): string {
  const url = process.env.API_URL?.trim()
  if (!url) {
    throw new Error("Set API_URL for server-side API calls")
  }
  return url.replace(/\/$/, "")
}
