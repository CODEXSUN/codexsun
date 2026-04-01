function readPort(rawValue: string | undefined, fallback: number) {
  const normalized = rawValue?.trim()
  if (!normalized) {
    return fallback
  }

  const parsed = Number(normalized)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const customApiEnvironment = {
  port: readPort(process.env.CUSTOM_API_PORT, 4101),
  corsOrigin: process.env.CUSTOM_WEB_ORIGIN?.trim() || 'http://localhost:5175',
}
