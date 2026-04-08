import type {
  AuthPermissionListResponse,
  AuthPermissionResponse,
  AuthRoleListResponse,
  AuthRoleResponse,
  AuthUserListResponse,
  AuthUserResponse,
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

export async function listFrameworkUsers() {
  return requestJson<AuthUserListResponse>("/internal/v1/cxapp/auth/users")
}

export async function getFrameworkUser(userId: string) {
  return requestJson<AuthUserResponse>(
    `/internal/v1/cxapp/auth/user?id=${encodeURIComponent(userId)}`
  )
}

export async function listFrameworkRoles() {
  return requestJson<AuthRoleListResponse>("/internal/v1/cxapp/auth/roles")
}

export async function getFrameworkRole(roleId: string) {
  return requestJson<AuthRoleResponse>(
    `/internal/v1/cxapp/auth/role?id=${encodeURIComponent(roleId)}`
  )
}

export async function listFrameworkPermissions() {
  return requestJson<AuthPermissionListResponse>("/internal/v1/cxapp/auth/permissions")
}

export async function getFrameworkPermission(permissionId: string) {
  return requestJson<AuthPermissionResponse>(
    `/internal/v1/cxapp/auth/permission?id=${encodeURIComponent(permissionId)}`
  )
}

export async function createFrameworkPermission(payload: unknown) {
  return requestJson<AuthPermissionResponse>("/internal/v1/cxapp/auth/permissions", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateFrameworkPermission(permissionId: string, payload: unknown) {
  return requestJson<AuthPermissionResponse>(
    `/internal/v1/cxapp/auth/permission?id=${encodeURIComponent(permissionId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )
}

export async function createFrameworkRole(payload: unknown) {
  return requestJson<AuthRoleResponse>("/internal/v1/cxapp/auth/roles", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateFrameworkRole(roleId: string, payload: unknown) {
  return requestJson<AuthRoleResponse>(
    `/internal/v1/cxapp/auth/role?id=${encodeURIComponent(roleId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )
}

export async function createFrameworkUser(payload: unknown) {
  return requestJson<AuthUserResponse>("/internal/v1/cxapp/auth/users", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateFrameworkUser(userId: string, payload: unknown) {
  return requestJson<AuthUserResponse>(
    `/internal/v1/cxapp/auth/user?id=${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )
}

export async function deleteFrameworkUser(userId: string) {
  return requestJson<{ deleted: true }>(
    `/internal/v1/cxapp/auth/user?id=${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    }
  )
}
