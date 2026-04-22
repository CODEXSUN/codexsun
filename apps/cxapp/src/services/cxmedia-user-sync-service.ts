import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { AuthUser } from "../../shared/index.js"

type CxmediaRole = "admin" | "editor" | "viewer"

function getCxmediaSyncSettings(config: ServerConfig) {
  const settings = config.media.cxmedia

  if (!settings.enabled || !settings.baseUrl || !settings.syncSecret) {
    return null
  }

  return settings
}

function mapUserToCxmediaRole(user: AuthUser): CxmediaRole {
  if (user.isSuperAdmin || user.actorType === "admin") {
    return "admin"
  }

  if (
    user.actorType === "staff" ||
    user.actorType === "employee" ||
    user.actorType === "partner" ||
    user.actorType === "supplier" ||
    user.actorType === "vendor"
  ) {
    return "editor"
  }

  return "viewer"
}

async function postSyncRequest(
  config: ServerConfig,
  path: string,
  payload: Record<string, unknown>
) {
  const settings = getCxmediaSyncSettings(config)

  if (!settings) {
    return
  }

  const response = await fetch(new URL(path, settings.baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cxmedia-sync-secret": settings.syncSecret,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new ApplicationError(
      errorPayload?.error ?? "cxmedia user sync failed.",
      {
        path,
        status: response.status,
      },
      502
    )
  }
}

export async function syncUserToCxmedia(
  config: ServerConfig,
  input: {
    passwordHash: string
    previousEmail?: string | null
    user: AuthUser
  }
) {
  await postSyncRequest(config, "/api/internal/users/sync", {
    active: input.user.isActive,
    email: input.user.email,
    name: input.user.displayName,
    passwordHash: input.passwordHash,
    previousEmail: input.previousEmail ?? null,
    role: mapUserToCxmediaRole(input.user),
  })
}

export async function deleteUserFromCxmedia(config: ServerConfig, email: string) {
  await postSyncRequest(config, "/api/internal/users/delete", {
    email,
  })
}
