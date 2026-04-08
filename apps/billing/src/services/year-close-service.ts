import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  billingFinancialYearCloseWorkflowActionPayloadSchema,
  billingFinancialYearCloseWorkflowResponseSchema,
  billingFinancialYearCloseWorkflowSchema,
  billingVoucherSchema,
} from "../../shared/index.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingVoucherApprover, assertBillingViewer } from "./access.js"
import { getBillingAccountingReports } from "./reporting-service.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

async function readYearCloseWorkflows(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.yearCloseWorkflows,
    billingFinancialYearCloseWorkflowSchema
  )
}

async function readVouchers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.vouchers, billingVoucherSchema)
}

function resolveFinancialYearCandidate(vouchers: Awaited<ReturnType<typeof readVouchers>>, financialYearCode?: string | null) {
  const financialYears = new Map<
    string,
    {
      code: string
      label: string
      startDate: string
      endDate: string
      voucherCount: number
    }
  >()

  for (const voucher of vouchers) {
    const current = financialYears.get(voucher.financialYear.code) ?? {
      code: voucher.financialYear.code,
      label: voucher.financialYear.label,
      startDate: voucher.financialYear.startDate,
      endDate: voucher.financialYear.endDate,
      voucherCount: 0,
    }
    current.voucherCount += 1
    financialYears.set(voucher.financialYear.code, current)
  }

  const sorted = [...financialYears.values()].sort(
    (left, right) => right.endDate.localeCompare(left.endDate)
  )

  if (sorted.length === 0) {
    throw new ApplicationError("No billing financial year is available for close workflow.", {}, 409)
  }

  if (!financialYearCode) {
    return sorted[0]
  }

  const matched = sorted.find((item) => item.code === financialYearCode)

  if (!matched) {
    throw new ApplicationError("Billing financial year could not be found.", { financialYearCode }, 404)
  }

  return matched
}

export async function executeBillingYearCloseWorkflow(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  payload: unknown
) {
  assertBillingVoucherApprover(user)

  const parsedPayload = billingFinancialYearCloseWorkflowActionPayloadSchema.parse(payload)
  const vouchers = await readVouchers(database)
  const candidate = resolveFinancialYearCandidate(
    vouchers,
    parsedPayload.financialYearCode
  )

  if (!candidate) {
    throw new ApplicationError(
      "Billing financial year could not be resolved for close workflow.",
      { financialYearCode: parsedPayload.financialYearCode },
      404
    )
  }
  const reports = await getBillingAccountingReports(database, user, config)
  const blockedItemCount = reports.item.monthEndChecklist.blockedCount
  const readyItemCount = reports.item.monthEndChecklist.readyCount
  const status =
    parsedPayload.action === "close"
      ? "closed"
      : blockedItemCount > 0
        ? "blocked"
        : "ready_to_close"

  if (parsedPayload.action === "close" && blockedItemCount > 0) {
    throw new ApplicationError(
      "Financial year close is blocked until month-end checklist blockers are resolved.",
      {
        financialYearCode: candidate.code,
        blockedItemCount,
      },
      409
    )
  }

  const timestamp = new Date().toISOString()
  const workflows = await readYearCloseWorkflows(database)
  const nextItem = billingFinancialYearCloseWorkflowSchema.parse({
    financialYearCode: candidate.code,
    financialYearLabel: candidate.label,
    startDate: candidate.startDate,
    endDate: candidate.endDate,
    voucherCount: candidate.voucherCount,
    status,
    blockedItemCount,
    readyItemCount,
    lastEvaluatedAt: timestamp,
    closedAt: parsedPayload.action === "close" ? timestamp : null,
    closedByUserId: parsedPayload.action === "close" ? user.id : null,
    note: parsedPayload.note,
  })

  const remaining = workflows.filter(
    (item) => item.financialYearCode !== nextItem.financialYearCode
  )
  const nextItems = [nextItem, ...remaining].sort((left, right) =>
    right.endDate.localeCompare(left.endDate)
  )

  await replaceStorePayloads(
    database,
    billingTableNames.yearCloseWorkflows,
    nextItems.map((item, index) => ({
      id: `year-close:${item.financialYearCode}`,
      moduleKey: "year-close-workflows",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.lastEvaluatedAt,
      updatedAt: item.lastEvaluatedAt,
    }))
  )

  return billingFinancialYearCloseWorkflowResponseSchema.parse({
    item: nextItem,
  })
}

export async function getBillingYearCloseWorkflow(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingViewer(user)

  const workflows = await readYearCloseWorkflows(database)
  return workflows[0] ?? null
}
