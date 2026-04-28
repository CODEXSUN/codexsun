import type {
  TenantVisibilityAdminSnapshotResponse,
  TenantVisibilityProfileUpdatePayload,
  TenantVisibilityProfileUpdateResponse,
} from "@cxapp/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        }
      : {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
  })

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    )
  }

  return payload as T
}

export async function getTenantVisibilityAdminSnapshot() {
  return requestJson<TenantVisibilityAdminSnapshotResponse>("/internal/v1/cxapp/tenant-visibility")
}

export async function saveTenantVisibilityProfile(
  payload: TenantVisibilityProfileUpdatePayload
) {
  return requestJson<TenantVisibilityProfileUpdateResponse>("/internal/v1/cxapp/tenant-visibility", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}
