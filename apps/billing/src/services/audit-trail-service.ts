import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { listActivityLogs } from "../../../framework/src/runtime/activity-log/activity-log-service.js"
import {
  billingAuditTrailReviewResponseSchema,
  type BillingAuditTrailEntry,
} from "../../shared/index.js"

import { assertBillingAuditViewer } from "./access.js"

function mapBillingAuditEntry(
  item: Awaited<ReturnType<typeof listActivityLogs>>["items"][number]
): BillingAuditTrailEntry {
  const context = item.context ?? {}

  return {
    id: item.id,
    action: item.action,
    level: item.level,
    message: item.message,
    actorEmail: item.actorEmail,
    actorType: item.actorType,
    routePath: item.routePath,
    voucherId:
      typeof context.voucherId === "string" && context.voucherId.trim()
        ? context.voucherId
        : null,
    voucherNumber:
      typeof context.voucherNumber === "string" && context.voucherNumber.trim()
        ? context.voucherNumber
        : null,
    reversalVoucherNumber:
      typeof context.reversalVoucherNumber === "string" &&
      context.reversalVoucherNumber.trim()
        ? context.reversalVoucherNumber
        : null,
    createdAt: item.createdAt,
  }
}

function countActions(items: BillingAuditTrailEntry[], action: string) {
  return items.filter((item) => item.action === action).length
}

export async function getBillingAuditTrailReview(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingAuditViewer(user)

  const logs = await listActivityLogs(database, {
    category: "billing",
    limit: 200,
  })
  const items = logs.items.map((item) => mapBillingAuditEntry(item))

  return billingAuditTrailReviewResponseSchema.parse({
    item: {
      totalEntries: items.length,
      infoCount: items.filter((item) => item.level === "info").length,
      warnCount: items.filter((item) => item.level === "warn").length,
      errorCount: items.filter((item) => item.level === "error").length,
      createCount: countActions(items, "voucher_create"),
      postCount: countActions(items, "voucher_post"),
      cancelCount: countActions(items, "voucher_cancel"),
      deleteCount: countActions(items, "voucher_delete"),
      reverseCount: countActions(items, "voucher_reverse"),
      reviewCount: countActions(items, "voucher_review"),
      reconcileCount: countActions(items, "voucher_reconcile"),
      items,
    },
  })
}
