import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  billingFinancialYearCloseWorkflowSchema,
  billingLedgerSchema,
  billingOpeningBalanceRolloverActionPayloadSchema,
  billingOpeningBalanceRolloverPolicySchema,
  billingOpeningBalanceRolloverResponseSchema,
} from "../../shared/index.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingVoucherApprover, assertBillingViewer } from "./access.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

async function readYearCloseWorkflows(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.yearCloseWorkflows,
    billingFinancialYearCloseWorkflowSchema
  )
}

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

async function readOpeningBalanceRollovers(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.openingBalanceRollovers,
    billingOpeningBalanceRolloverPolicySchema
  )
}

function deriveNextFinancialYear(input: { label: string; endDate: string }) {
  const [startYearText, endYearText] = input.label.split("-")
  const startYear = Number(startYearText)
  const endYear = Number(`20${endYearText}`)
  const nextStartYear = startYear + 1
  const nextEndYear = endYear + 1

  return {
    code: `FY${nextStartYear}-${String(nextEndYear).slice(-2)}`,
    label: `${nextStartYear}-${String(nextEndYear).slice(-2)}`,
  }
}

export async function executeBillingOpeningBalanceRollover(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingVoucherApprover(user)

  const parsedPayload = billingOpeningBalanceRolloverActionPayloadSchema.parse(payload)
  const workflows = await readYearCloseWorkflows(database)
  const sourceWorkflow = parsedPayload.sourceFinancialYearCode
    ? workflows.find((item) => item.financialYearCode === parsedPayload.sourceFinancialYearCode)
    : workflows.find((item) => item.status === "closed") ?? workflows[0]

  if (!sourceWorkflow) {
    throw new ApplicationError(
      "No closed billing financial year is available for opening-balance rollover.",
      {},
      409
    )
  }

  if (sourceWorkflow.status !== "closed") {
    throw new ApplicationError(
      "Opening-balance rollover requires a closed billing financial year.",
      { financialYearCode: sourceWorkflow.financialYearCode, status: sourceWorkflow.status },
      409
    )
  }

  const nextFinancialYear = deriveNextFinancialYear({
    label: sourceWorkflow.financialYearLabel,
    endDate: sourceWorkflow.endDate,
  })
  const ledgers = await readLedgers(database)
  const timestamp = new Date().toISOString()
  const items = ledgers
    .map((ledger) => {
      const carryForward = ["asset", "liability"].includes(ledger.nature)
      return {
        ledgerId: ledger.id,
        ledgerName: ledger.name,
        ledgerGroup: ledger.group,
        ledgerNature: ledger.nature,
        sourceClosingSide: ledger.closingSide,
        sourceClosingAmount: ledger.closingAmount,
        rolloverSide: carryForward ? ledger.closingSide : "debit",
        rolloverAmount: carryForward ? ledger.closingAmount : 0,
        policyTreatment: carryForward ? ("carry_forward" as const) : ("reset_nominal" as const),
      }
    })
    .sort((left, right) => left.ledgerName.localeCompare(right.ledgerName))

  const nextPolicy = billingOpeningBalanceRolloverPolicySchema.parse({
    sourceFinancialYearCode: sourceWorkflow.financialYearCode,
    targetFinancialYearCode: nextFinancialYear.code,
    targetFinancialYearLabel: nextFinancialYear.label,
    status: parsedPayload.action === "apply" ? "applied" : "previewed",
    itemCount: items.length,
    carryForwardLedgerCount: items.filter((item) => item.policyTreatment === "carry_forward").length,
    resetLedgerCount: items.filter((item) => item.policyTreatment === "reset_nominal").length,
    preparedAt: timestamp,
    preparedByUserId: user.id,
    appliedAt: parsedPayload.action === "apply" ? timestamp : null,
    appliedByUserId: parsedPayload.action === "apply" ? user.id : null,
    note: parsedPayload.note,
    items,
  })

  const existing = await readOpeningBalanceRollovers(database)
  const nextItems = [
    nextPolicy,
    ...existing.filter(
      (item) => item.sourceFinancialYearCode !== nextPolicy.sourceFinancialYearCode
    ),
  ].sort((left, right) =>
    right.sourceFinancialYearCode.localeCompare(left.sourceFinancialYearCode)
  )

  await replaceStorePayloads(
    database,
    billingTableNames.openingBalanceRollovers,
    nextItems.map((item, index) => ({
      id: `opening-balance-rollover:${item.sourceFinancialYearCode}`,
      moduleKey: "opening-balance-rollovers",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.preparedAt,
      updatedAt: item.preparedAt,
    }))
  )

  return billingOpeningBalanceRolloverResponseSchema.parse({
    item: nextPolicy,
  })
}

export async function getBillingOpeningBalanceRolloverPolicy(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingViewer(user)
  const items = await readOpeningBalanceRollovers(database)
  return items[0] ?? null
}
