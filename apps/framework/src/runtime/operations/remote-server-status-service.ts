import { randomBytes, randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  generatedMonitorSecretResponseSchema,
  remoteServerGeneratedSecretResponseSchema,
  remoteServerDashboardSchema,
  remoteServerSnapshotSchema,
  remoteServerTargetCreatePayloadSchema,
  remoteServerTargetDetailSchema,
  remoteServerTargetSchema,
  remoteServerTargetUpdatePayloadSchema,
  type RemoteServerDashboard,
} from "../../../shared/remote-server-status.js"
import type { ServerConfig } from "../config/server-config.js"
import { probeDatabase } from "../database/client.js"
import { ApplicationError } from "../errors/application-error.js"
import { getSystemUpdateStatus } from "../system-update/system-update-service.js"
import { frameworkOperationsTableNames } from "./operations-table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

type RemoteStatusFetch = (input: string, init?: RequestInit) => Promise<Response>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function nowIso() {
  return new Date().toISOString()
}

function generateMonitorSecret() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_!@#$%^&*"
  const bytes = randomBytes(48)

  return Array.from(bytes, (value) => characters[value % characters.length]).join("")
}

export function generateRemoteMonitorSecretValue() {
  return generatedMonitorSecretResponseSchema.parse({
    generatedSecret: generateMonitorSecret(),
  })
}

function normalizeBaseUrl(value: string) {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(value.trim())
  } catch {
    throw new ApplicationError("Server URL must be a valid absolute URL.", { value }, 400)
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ApplicationError(
      "Server URL must use http or https.",
      { value: parsedUrl.toString() },
      400
    )
  }

  parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "")
  parsedUrl.search = ""
  parsedUrl.hash = ""

  return parsedUrl.toString().replace(/\/+$/, "")
}

function mapTargetRow(row: Record<string, unknown>) {
  return remoteServerTargetSchema.parse({
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    baseUrl: String(row.base_url ?? ""),
    description: row.description == null ? null : String(row.description),
    isActive: Number(row.is_active ?? 0) === 1,
    hasMonitorSecret:
      typeof row.monitor_secret === "string" && row.monitor_secret.trim().length > 0,
    confirmedAt: row.confirmed_at == null ? null : String(row.confirmed_at),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    createdBy: row.created_by == null ? null : String(row.created_by),
    updatedBy: row.updated_by == null ? null : String(row.updated_by),
  })
}

function mapTargetDetailRow(row: Record<string, unknown>) {
  return remoteServerTargetDetailSchema.parse({
    ...mapTargetRow(row),
    monitorSecret: row.monitor_secret == null ? null : String(row.monitor_secret),
  })
}

export async function listRemoteServerTargets(database: Kysely<unknown>) {
  const rows = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.remoteServerTargets)
    .selectAll()
    .orderBy("name", "asc")
    .execute()

  return {
    items: rows.map((row) => mapTargetRow(row)),
  }
}

export async function createRemoteServerTarget(
  database: Kysely<unknown>,
  payload: unknown,
  actorEmail?: string | null
) {
  const parsed = remoteServerTargetCreatePayloadSchema.parse(payload)
  const baseUrl = normalizeBaseUrl(parsed.baseUrl)
  const createdAt = nowIso()
  const id = randomUUID()

  await asQueryDatabase(database)
    .insertInto(frameworkOperationsTableNames.remoteServerTargets)
    .values({
      id,
      name: parsed.name.trim(),
      base_url: baseUrl,
      description: parsed.description?.trim() ? parsed.description.trim() : null,
      is_active: parsed.isActive ? 1 : 0,
      monitor_secret: parsed.monitorSecret?.trim() ? parsed.monitorSecret.trim() : null,
      confirmed_at: null,
      created_at: createdAt,
      updated_at: createdAt,
      created_by: actorEmail ?? null,
      updated_by: actorEmail ?? null,
    })
    .execute()

  const row = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.remoteServerTargets)
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow()

  return {
    item: mapTargetRow(row),
  }
}

export async function getRemoteServerTarget(database: Kysely<unknown>, targetId: string) {
  const row = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.remoteServerTargets)
    .selectAll()
    .where("id", "=", targetId)
    .executeTakeFirst()

  if (!row) {
    throw new ApplicationError("Remote server target not found.", { targetId }, 404)
  }

  return {
    item: mapTargetDetailRow(row),
  }
}

export async function generateRemoteServerTargetSecret(
  database: Kysely<unknown>,
  targetId: string,
  actorEmail?: string | null
) {
  const target = await getRemoteServerTarget(database, targetId)
  const secret = generateMonitorSecret()
  const updatedAt = nowIso()

  await asQueryDatabase(database)
    .updateTable(frameworkOperationsTableNames.remoteServerTargets)
    .set({
      monitor_secret: secret,
      confirmed_at: null,
      updated_at: updatedAt,
      updated_by: actorEmail ?? null,
    })
    .where("id", "=", target.item.id)
    .execute()

  const row = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.remoteServerTargets)
    .selectAll()
    .where("id", "=", targetId)
    .executeTakeFirstOrThrow()

  return remoteServerGeneratedSecretResponseSchema.parse({
    item: mapTargetRow(row),
    generatedSecret: secret,
  })
}

export async function updateRemoteServerTarget(
  database: Kysely<unknown>,
  targetId: string,
  payload: unknown,
  actorEmail?: string | null
) {
  const existing = await getRemoteServerTarget(database, targetId)
  const parsed = remoteServerTargetUpdatePayloadSchema.parse(payload)
  const updatedAt = nowIso()
  const nextBaseUrl = normalizeBaseUrl(parsed.baseUrl)
  const nextMonitorSecret = parsed.monitorSecret?.trim()
  const secretChanged =
    nextMonitorSecret != null &&
    nextMonitorSecret.length > 0 &&
    nextMonitorSecret !== (existing.item.monitorSecret ?? "")

  await asQueryDatabase(database)
    .updateTable(frameworkOperationsTableNames.remoteServerTargets)
    .set({
      name: parsed.name.trim(),
      base_url: nextBaseUrl,
      description: parsed.description?.trim() ? parsed.description.trim() : null,
      is_active: parsed.isActive ? 1 : 0,
      monitor_secret:
        nextMonitorSecret != null && nextMonitorSecret.length > 0
          ? nextMonitorSecret
          : existing.item.monitorSecret,
      confirmed_at: secretChanged ? null : existing.item.confirmedAt,
      updated_at: updatedAt,
      updated_by: actorEmail ?? null,
    })
    .where("id", "=", targetId)
    .execute()

  const row = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.remoteServerTargets)
    .selectAll()
    .where("id", "=", targetId)
    .executeTakeFirstOrThrow()

  return {
    item: mapTargetRow(row),
  }
}

export async function deleteRemoteServerTarget(database: Kysely<unknown>, targetId: string) {
  const existing = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.remoteServerTargets)
    .select(["id"])
    .where("id", "=", targetId)
    .executeTakeFirst()

  if (!existing) {
    throw new ApplicationError("Remote server target not found.", { targetId }, 404)
  }

  await asQueryDatabase(database)
    .deleteFrom(frameworkOperationsTableNames.remoteServerTargets)
    .where("id", "=", targetId)
    .execute()

  return {
    deleted: true,
  }
}

export async function getLocalServerStatusSnapshot(
  config: ServerConfig,
  database: Kysely<unknown>
) {
  let databaseReachable = false

  try {
    await probeDatabase(database)
    databaseReachable = true
  } catch {
    databaseReachable = false
  }

  const updateStatus = await getSystemUpdateStatus(config)

  return remoteServerSnapshotSchema.parse({
    status: "live",
    generatedAt: nowIso(),
    appName: config.appName,
    appVersion: updateStatus.currentRevision?.version ?? null,
    environment: config.environment,
    appDomain: config.appDomain,
    frontendDomain: config.frontendDomain,
    appHttpPort: config.appHttpPort,
    frontendHttpPort: config.frontendHttpPort,
    databaseDriver: config.database.driver,
    databaseName: config.database.name ?? null,
    gitSyncEnabled: updateStatus.canAutoUpdate,
    gitBranch: updateStatus.branch ?? null,
    gitStatus: updateStatus.isClean ? "clean" : "dirty",
    canAutoUpdate: updateStatus.canAutoUpdate,
    hasRemoteUpdate: updateStatus.hasRemoteUpdate,
    latestUpdateMessage: updateStatus.currentRevision?.summary ?? null,
    latestUpdateTimestamp: updateStatus.currentRevision?.committedAt ?? null,
    healthUrl: `${config.tlsEnabled ? "https" : "http"}://${config.appDomain}/health`,
    databaseReachable,
  })
}

function summarizeDashboard(items: RemoteServerDashboard["items"]) {
  return {
    total: items.length,
    live: items.filter((item) => item.status === "live").length,
    pendingSecret: items.filter((item) => item.status === "pending_secret").length,
    unauthorized: items.filter((item) => item.status === "unauthorized").length,
    unreachable: items.filter((item) => item.status === "unreachable").length,
    invalidResponse: items.filter((item) => item.status === "invalid_response").length,
  }
}

async function confirmRemoteServerTarget(
  database: Kysely<unknown>,
  targetId: string,
  currentConfirmedAt: string | null,
  checkedAt: string
) {
  if (currentConfirmedAt) {
    return currentConfirmedAt
  }

  await asQueryDatabase(database)
    .updateTable(frameworkOperationsTableNames.remoteServerTargets)
    .set({
      confirmed_at: checkedAt,
      updated_at: checkedAt,
    })
    .where("id", "=", targetId)
    .execute()

  return checkedAt
}

async function fetchRemoteServerStatusItem(
  config: ServerConfig,
  database: Kysely<unknown>,
  targetId: string,
  options: {
    fetcher?: RemoteStatusFetch
  } = {}
) {
  const targetResponse = await getRemoteServerTarget(database, targetId)
  const fetcher = options.fetcher ?? fetch
  const target = targetResponse.item
  const checkedAt = nowIso()

  if (!target.isActive) {
    return {
      target,
      status: "unreachable" as const,
      checkedAt,
      latencyMs: null,
      error: "Server target is inactive.",
      snapshot: null,
    }
  }

  if (!target.monitorSecret?.trim()) {
    return {
      target,
      status: "pending_secret" as const,
      checkedAt,
      latencyMs: null,
      error: "Generate and assign a server monitor secret for this target.",
      snapshot: null,
    }
  }

  const startedAt = Date.now()

  try {
    const response = await fetcher(`${target.baseUrl}/api/v1/framework/server-status`, {
      cache: "no-store",
      headers: {
        "x-codexsun-monitor-key": target.monitorSecret,
      },
    })
    const latencyMs = Date.now() - startedAt

    if (response.status === 401 || response.status === 403) {
      return {
        target,
        status: "unauthorized" as const,
        checkedAt,
        latencyMs,
        error: `Remote server rejected this target secret with HTTP ${response.status}.`,
        snapshot: null,
      }
    }

    const payload = (await response.json().catch(() => null)) as unknown

    if (!response.ok) {
      return {
        target,
        status: "unreachable" as const,
        checkedAt,
        latencyMs,
        error: `Remote server returned HTTP ${response.status}.`,
        snapshot: null,
      }
    }

    const snapshot = remoteServerSnapshotSchema.safeParse(payload)

    if (!snapshot.success) {
      return {
        target,
        status: "invalid_response" as const,
        checkedAt,
        latencyMs,
        error: "Remote server returned an invalid status payload.",
        snapshot: null,
      }
    }

    const confirmedAt = await confirmRemoteServerTarget(
      database,
      target.id,
      target.confirmedAt,
      checkedAt
    )

    return {
      target: {
        ...target,
        confirmedAt,
      },
      status: "live" as const,
      checkedAt,
      latencyMs,
      error: null,
      snapshot: snapshot.data,
    }
  } catch (error) {
    return {
      target,
      status: "unreachable" as const,
      checkedAt,
      latencyMs: null,
      error: error instanceof Error ? error.message : "Remote request failed.",
      snapshot: null,
    }
  }
}

export async function getRemoteServerStatus(
  config: ServerConfig,
  database: Kysely<unknown>,
  targetId: string,
  options: {
    fetcher?: RemoteStatusFetch
  } = {}
) {
  return fetchRemoteServerStatusItem(config, database, targetId, options)
}

export async function getRemoteServerDashboard(
  config: ServerConfig,
  database: Kysely<unknown>,
  options: {
    fetcher?: RemoteStatusFetch
  } = {}
) {
  const targets = await listRemoteServerTargets(database)
  const generatedAt = nowIso()
  const items = await Promise.all(
    targets.items.map((target) =>
      fetchRemoteServerStatusItem(config, database, target.id, options)
    )
  )

  return remoteServerDashboardSchema.parse({
    generatedAt,
    monitorConfigured: true,
    items,
    summary: summarizeDashboard(items),
  })
}
