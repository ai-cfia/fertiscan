export function truncateUuid(uuid: string, length = 8): string {
  if (!uuid || uuid.length <= length) {
    return uuid
  }
  return `${uuid.substring(0, length)}...`
}
