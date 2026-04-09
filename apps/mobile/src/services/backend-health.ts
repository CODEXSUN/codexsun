import { getApiBaseUrl } from "@mobile/config/mobile-config"

export type BackendHealthResult = {
  ok: boolean
  status: number | null
  body: string
  checkedAt: string
  url: string
}

export async function fetchBackendHealth(
  configuredBaseUrl?: string
): Promise<BackendHealthResult> {
  const resolvedBaseUrl = configuredBaseUrl ?? (await getApiBaseUrl())
  const baseUrl = resolvedBaseUrl.replace(/\/$/, "")
  const url = `${baseUrl}/health`

  try {
    const response = await fetch(url)
    const body = await response.text()

    return {
      ok: response.ok,
      status: response.status,
      body: body.trim() || "No response body returned.",
      checkedAt: new Date().toISOString(),
      url,
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      body:
        error instanceof Error
          ? error.message
          : "Unable to reach the configured backend.",
      checkedAt: new Date().toISOString(),
      url,
    }
  }
}
