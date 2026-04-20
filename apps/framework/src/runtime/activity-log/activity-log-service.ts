import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  activityLogItemSchema,
  activityLogListResponseSchema,
  activityLogWritePayloadSchema,
  activityLogWriteResponseSchema,
  type ActivityLogItem,
} from "../../../shared/activity-log.js"
import type { HttpRouteHandlerContext } from "../http/route-types.js"
import { frameworkActivityLogTableNames } from "./activity-log-table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function asNullableString(value: unknown) {
  return value === null || value === undefined ? null : String(value)
}

function parseContextJson(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

function mapActivityLogRow(row: Record<string, unknown>): ActivityLogItem | null {
  const parsed = activityLogItemSchema.safeParse({
    id: String(row.id ?? ""),
    category: String(row.category ?? ""),
    action: String(row.action ?? ""),
    level: String(row.level ?? "info") as ActivityLogItem["level"],
    message: String(row.message ?? ""),
    actorId: asNullableString(row.actor_id),
    actorEmail: asNullableString(row.actor_email),
    actorType: asNullableString(row.actor_type),
    requestId: asNullableString(row.request_id),
    routePath: asNullableString(row.route_path),
    context: parseContextJson(row.context_json),
    createdAt: String(row.created_at ?? ""),
  })

  return parsed.success ? parsed.data : null
}

export async function listActivityLogs(
  database: Kysely<unknown>,
  options: {
    category?: string | null
    level?: string | null
    limit?: number
  } = {}
) {
  let query = asQueryDatabase(database)
    .selectFrom(frameworkActivityLogTableNames.auditLogs)
    .selectAll()

  if (options.category?.trim()) {
    query = query.where("category", "=", options.category.trim())
  }

  if (options.level?.trim()) {
    query = query.where("level", "=", options.level.trim())
  }

  const rows = await query
    .orderBy("created_at", "desc")
    .limit(options.limit ?? 100)
    .execute()

  return activityLogListResponseSchema.parse({
    items: rows
      .map((row) => mapActivityLogRow(row))
      .filter((item): item is ActivityLogItem => Boolean(item)),
  })
}

export async function writeActivityLog(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsedPayload = activityLogWritePayloadSchema.parse(payload)
  const item = {
    id: randomUUID(),
    category: parsedPayload.category.trim(),
    action: parsedPayload.action.trim(),
    level: parsedPayload.level,
    message: parsedPayload.message.trim(),
    actor_id: parsedPayload.actorId ?? null,
    actor_email: parsedPayload.actorEmail ?? null,
    actor_type: parsedPayload.actorType ?? null,
    request_id: parsedPayload.requestId ?? null,
    route_path: parsedPayload.routePath ?? null,
    context_json: parsedPayload.context ? JSON.stringify(parsedPayload.context) : null,
    created_at: new Date().toISOString(),
  }

  await asQueryDatabase(database)
    .insertInto(frameworkActivityLogTableNames.auditLogs)
    .values(item)
    .execute()

  const mappedItem = mapActivityLogRow(item)

  if (!mappedItem) {
    throw new Error("Activity log row could not be normalized after write.")
  }

  return activityLogWriteResponseSchema.parse({
    item: mappedItem,
  })
}

export async function writeFrameworkActivityFromContext(
  context: HttpRouteHandlerContext,
  actor: {
    id?: string | null
    email?: string | null
    actorType?: string | null
  },
  input: {
    category: string
    action: string
    level?: "info" | "warn" | "error"
    message: string
    details?: Record<string, unknown>
  }
) {
  return writeActivityLog(context.databases.primary, {
    category: input.category,
    action: input.action,
    level: input.level ?? "info",
    message: input.message,
    actorId: actor.id ?? null,
    actorEmail: actor.email ?? null,
    actorType: actor.actorType ?? null,
    requestId: context.request.requestId ?? null,
    routePath: context.route.path,
    context: input.details ?? null,
  })
}
