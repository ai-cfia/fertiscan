// ============================== User display helpers ==============================

export function getUserInitials(
  user:
    | {
        first_name?: string | null
        last_name?: string | null
        email?: string | null
      }
    | null
    | undefined,
): string {
  if (!user) return "?"
  const { first_name, last_name, email } = user
  if (first_name && last_name) return `${first_name[0]}${last_name[0]}`
  if (first_name) return first_name[0]
  if (last_name) return last_name[0]
  return email?.[0] ?? "?"
}
