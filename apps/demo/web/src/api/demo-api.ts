import type {
  DemoInstallJobPayload,
  DemoInstallJobResponse,
  DemoInstallResponse,
  DemoProfile,
  DemoProfileId,
  DemoSummaryResponse,
} from "@demo/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

async function requestJson<T>(url: string, options: RequestInit = {}) {
  const accessToken = getStoredAccessToken()
  const headers = new Headers(options.headers)

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`)
  }

  if (options.body != null && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | T
    | null

  if (!response.ok) {
    throw new Error(
      (payload && typeof payload === "object" && "error" in payload && payload.error) ||
        (payload && typeof payload === "object" && "message" in payload && payload.message) ||
        `Request failed with status ${response.status}.`
    )
  }

  return payload as T
}

export const demoApi = {
  getSummary() {
    return requestJson<DemoSummaryResponse>("/internal/v1/demo/summary", {
      cache: "no-store",
    })
  },
  getProfiles() {
    return requestJson<{ items: DemoProfile[] }>("/internal/v1/demo/profiles", {
      cache: "no-store",
    })
  },
  install(profileId: DemoProfileId) {
    return requestJson<DemoInstallResponse>("/internal/v1/demo/install", {
      method: "POST",
      body: JSON.stringify({ profileId }),
    })
  },
  startJob(payload: DemoInstallJobPayload) {
    return requestJson<DemoInstallJobResponse>("/internal/v1/demo/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
  getJob(jobId: string) {
    return requestJson<DemoInstallJobResponse>(`/internal/v1/demo/job?id=${encodeURIComponent(jobId)}`, {
      cache: "no-store",
    })
  },
}
