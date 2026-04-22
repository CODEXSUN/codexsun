import { readSession } from "./session"
import type { AdminUser, MediaItem, Session, SettingsPayload } from "./types"

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readSession()
  const headers = new Headers(init?.headers ?? {})

  if (session?.accessToken) {
    headers.set("authorization", `Bearer ${session.accessToken}`)
  }

  const response = await fetch(path, {
    ...init,
    headers,
  })

  const isJson = (response.headers.get("content-type") || "").includes("application/json")
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null)

  if (!response.ok) {
    throw new Error(
      (payload as { error?: string; message?: string } | null)?.error ||
        (payload as { error?: string; message?: string } | null)?.message ||
        `Request failed with status ${response.status}.`
    )
  }

  return payload as T
}

export function loginWithPassword(email: string, password: string) {
  return apiRequest<Session>("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })
}

export function consumeHandoffToken(token: string) {
  return apiRequest<Session>("/api/auth/handoff/consume", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      token,
    }),
  })
}

export function loadFiles() {
  return apiRequest<{ items: MediaItem[] }>("/api/files")
}

export function loadSettings() {
  return apiRequest<SettingsPayload>("/api/settings")
}

export function loadAdminUsers() {
  return apiRequest<{ users: AdminUser[] }>("/api/admin/users")
}

export function uploadFile(formData: FormData) {
  return apiRequest<{ item: MediaItem }>("/api/upload", {
    method: "POST",
    body: formData,
  })
}

export function deleteFile(path: string) {
  return apiRequest<{ deleted?: boolean }>(`/api/file?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  })
}

export function createSignedUrl(path: string) {
  return apiRequest<{ url: string }>("/api/signed-url", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action: "download",
      path,
    }),
  })
}

export function updateRuntimeSettings(payload: {
  allowedMimeTypes: string[]
  defaultUploadVisibility: "public" | "private"
  signedUrlExpiresInSeconds: number
}) {
  return apiRequest("/api/settings", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function createAdminUser(payload: {
  email: string
  name: string
  password: string
  role: "admin" | "editor" | "viewer"
}) {
  return apiRequest("/api/admin/users", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function updateAdminUser(payload: {
  active: boolean
  email: string
  name: string
  password?: string
  role: "admin" | "editor" | "viewer"
}) {
  return apiRequest("/api/admin/users", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}
