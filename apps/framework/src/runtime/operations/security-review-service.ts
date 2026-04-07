import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  securityReviewCompletePayloadSchema,
  securityReviewDashboardSchema,
  securityReviewItemSchema,
  securityReviewItemUpdatePayloadSchema,
  securityReviewRunSchema,
} from "../../../shared/database-operations.js"
import { ApplicationError } from "../errors/application-error.js"
import { frameworkOperationsTableNames } from "./operations-table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function nowIso() {
  return new Date().toISOString()
}

const defaultSecurityReviewItems = [
  {
    section: "Authentication",
    controlKey: "v2-authentication-flow",
    title: "Shared authentication flows are protected and non-debug in production.",
    description: "Validate OTP debug is disabled, strong credentials are enforced, and privileged logins follow the shared cxapp auth boundary.",
  },
  {
    section: "Access Control",
    controlKey: "v4-admin-authorization",
    title: "Admin and internal routes enforce actor and IP policy correctly.",
    description: "Review admin-only routes, internal API restrictions, and confirm role/permission assignment covers the sensitive framework surfaces.",
  },
  {
    section: "Session Management",
    controlKey: "v3-session-lifecycle",
    title: "Administrative sessions follow the idle timeout and revocation rules.",
    description: "Check admin idle timeout settings, logout behavior, and verify stale sessions are revoked from the active auth store.",
  },
  {
    section: "Cryptography",
    controlKey: "v6-secret-rotation",
    title: "Secrets are rotated, owned, and tracked with current dates.",
    description: "Verify JWT, SMTP, payment, and connector secrets have owners and a recent recorded rotation event.",
  },
  {
    section: "Configuration",
    controlKey: "v14-production-safety",
    title: "Production-safe runtime config is enforced.",
    description: "Confirm HTTPS-only settings, real domains, TLS or trusted proxy mode, and non-default JWT secrets are present.",
  },
  {
    section: "Data Protection",
    controlKey: "v9-backup-restore",
    title: "Database backups, restore drill, and retention are operational.",
    description: "Validate scheduled backups exist, retention is enforced, restore drill passes, and backup copies are available off-machine.",
  },
  {
    section: "Logging",
    controlKey: "v10-audit-observability",
    title: "Audit logging and monitoring thresholds cover critical commerce paths.",
    description: "Review structured logs, activity log coverage, and alerting for checkout, payment verify, webhook, order creation, and mail send.",
  },
  {
    section: "Error Handling",
    controlKey: "v13-safe-errors",
    title: "Public and admin error responses avoid leaking sensitive details.",
    description: "Check application errors, validation errors, and unhandled errors remain bounded and do not expose secrets or private state.",
  },
  {
    section: "Third Party",
    controlKey: "v1-dependency-hygiene",
    title: "External integrations are configured minimally and reviewed.",
    description: "Review Google Drive backup credentials, Razorpay secrets, and connector keys for least privilege and current ownership.",
  },
  {
    section: "Operations",
    controlKey: "v19-incident-readiness",
    title: "Operators have current recovery and escalation knowledge.",
    description: "Confirm operators know how to restore backups, review alerts, and escalate payment, mail, or release incidents.",
  },
] as const

function mapItemRow(row: Record<string, unknown>) {
  return securityReviewItemSchema.parse({
    id: String(row.id ?? ""),
    section: String(row.section ?? ""),
    controlKey: String(row.control_key ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    status: String(row.status ?? "not_started"),
    evidence: row.evidence == null ? null : String(row.evidence),
    notes: row.notes == null ? null : String(row.notes),
    reviewedBy: row.reviewed_by == null ? null : String(row.reviewed_by),
    reviewedAt: row.reviewed_at == null ? null : String(row.reviewed_at),
    updatedAt: String(row.updated_at ?? ""),
  })
}

function mapRunRow(row: Record<string, unknown>) {
  return securityReviewRunSchema.parse({
    id: String(row.id ?? ""),
    overallStatus: String(row.overall_status ?? "healthy"),
    summary: String(row.summary ?? ""),
    reviewedBy: row.reviewed_by == null ? null : String(row.reviewed_by),
    reviewedAt: String(row.reviewed_at ?? ""),
    createdAt: String(row.created_at ?? ""),
  })
}

async function ensureDefaultSecurityReviewItems(database: Kysely<unknown>) {
  const countRow = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.securityReviewItems)
    .select(({ fn }) => fn.count<string>("id").as("count"))
    .executeTakeFirst()

  if (Number(countRow?.count ?? 0) > 0) {
    return
  }

  const createdAt = nowIso()
  await asQueryDatabase(database)
    .insertInto(frameworkOperationsTableNames.securityReviewItems)
    .values(
      defaultSecurityReviewItems.map((item) => ({
        id: randomUUID(),
        section: item.section,
        control_key: item.controlKey,
        title: item.title,
        description: item.description,
        status: "not_started",
        evidence: null,
        notes: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: createdAt,
      }))
    )
    .execute()
}

export async function getSecurityReviewDashboard(database: Kysely<unknown>) {
  await ensureDefaultSecurityReviewItems(database)
  const [itemRows, runRows] = await Promise.all([
    asQueryDatabase(database)
      .selectFrom(frameworkOperationsTableNames.securityReviewItems)
      .selectAll()
      .orderBy("section", "asc")
      .execute(),
    asQueryDatabase(database)
      .selectFrom(frameworkOperationsTableNames.securityReviewRuns)
      .selectAll()
      .orderBy("created_at", "desc")
      .execute(),
  ])

  const items = itemRows.map((row) => mapItemRow(row))
  const runs = runRows.map((row) => mapRunRow(row))
  const passed = items.filter((item) => item.status === "passed").length
  const failed = items.filter((item) => item.status === "failed").length
  const inReview = items.filter((item) => item.status === "in_review").length
  const remaining = items.filter((item) => item.status === "not_started").length

  return securityReviewDashboardSchema.parse({
    lastReviewedAt: runs[0]?.reviewedAt ?? null,
    counts: {
      total: items.length,
      passed,
      failed,
      inReview,
      remaining,
    },
    items,
    runs,
  })
}

export async function updateSecurityReviewItem(
  database: Kysely<unknown>,
  itemId: string,
  payload: unknown
) {
  const parsed = securityReviewItemUpdatePayloadSchema.parse(payload)
  const existing = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.securityReviewItems)
    .selectAll()
    .where("id", "=", itemId)
    .executeTakeFirst()

  if (!existing) {
    throw new ApplicationError("Security review item not found.", { itemId }, 404)
  }

  const updatedAt = nowIso()
  await asQueryDatabase(database)
    .updateTable(frameworkOperationsTableNames.securityReviewItems)
    .set({
      status: parsed.status,
      evidence: parsed.evidence ?? null,
      notes: parsed.notes ?? null,
      reviewed_by: parsed.reviewedBy ?? null,
      reviewed_at: parsed.status === "not_started" ? null : updatedAt,
      updated_at: updatedAt,
    })
    .where("id", "=", itemId)
    .execute()

  const item = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.securityReviewItems)
    .selectAll()
    .where("id", "=", itemId)
    .executeTakeFirstOrThrow()

  return {
    item: mapItemRow(item),
  }
}

export async function completeSecurityReview(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsed = securityReviewCompletePayloadSchema.parse(payload)
  const dashboard = await getSecurityReviewDashboard(database)
  const overallStatus = dashboard.counts.failed > 0 ? "attention" : "healthy"
  const reviewedAt = nowIso()
  const run = mapRunRow({
    id: randomUUID(),
    overall_status: overallStatus,
    summary: parsed.summary,
    reviewed_by: parsed.reviewedBy ?? null,
    reviewed_at: reviewedAt,
    created_at: reviewedAt,
  })

  await asQueryDatabase(database)
    .insertInto(frameworkOperationsTableNames.securityReviewRuns)
    .values({
      id: run.id,
      overall_status: run.overallStatus,
      summary: run.summary,
      reviewed_by: run.reviewedBy,
      reviewed_at: run.reviewedAt,
      created_at: run.createdAt,
    })
    .execute()

  return {
    run,
  }
}
