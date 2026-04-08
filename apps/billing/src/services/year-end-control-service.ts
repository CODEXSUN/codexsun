import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  billingFinancialYearCloseWorkflowSchema,
  billingLedgerSchema,
  billingOpeningBalanceRolloverPolicySchema,
  billingVoucherSchema,
  billingYearEndAdjustmentControlActionPayloadSchema,
  billingYearEndAdjustmentControlPolicySchema,
  billingYearEndAdjustmentControlResponseSchema,
} from "../../shared/index.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer, assertBillingVoucherApprover } from "./access.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

async function readYearCloseWorkflows(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.yearCloseWorkflows,
    billingFinancialYearCloseWorkflowSchema
  )
}

async function readOpeningBalanceRollovers(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.openingBalanceRollovers,
    billingOpeningBalanceRolloverPolicySchema
  )
}

async function readYearEndControls(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.yearEndControls,
    billingYearEndAdjustmentControlPolicySchema
  )
}

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

async function readVouchers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.vouchers, billingVoucherSchema)
}

function deriveNextFinancialYear(input: { label: string }) {
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

export async function executeBillingYearEndAdjustmentControl(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingVoucherApprover(user)

  const parsedPayload = billingYearEndAdjustmentControlActionPayloadSchema.parse(payload)
  const [yearCloseWorkflows, openingBalanceRollovers, ledgers, vouchers] = await Promise.all([
    readYearCloseWorkflows(database),
    readOpeningBalanceRollovers(database),
    readLedgers(database),
    readVouchers(database),
  ])

  const sourceWorkflow = parsedPayload.sourceFinancialYearCode
    ? yearCloseWorkflows.find(
        (item) => item.financialYearCode === parsedPayload.sourceFinancialYearCode
      )
    : yearCloseWorkflows.find((item) => item.status === "closed") ?? yearCloseWorkflows[0]

  if (!sourceWorkflow) {
    if (parsedPayload.sourceFinancialYearCode) {
      throw new ApplicationError(
        "Year-end controls require a closed billing financial year.",
        { financialYearCode: parsedPayload.sourceFinancialYearCode, status: "missing" },
        409
      )
    }

    throw new ApplicationError(
      "No billing financial year is available for year-end controls.",
      {},
      409
    )
  }

  if (sourceWorkflow.status !== "closed") {
    throw new ApplicationError(
      "Year-end controls require a closed billing financial year.",
      { financialYearCode: sourceWorkflow.financialYearCode, status: sourceWorkflow.status },
      409
    )
  }

  const rolloverPolicy = openingBalanceRollovers.find(
    (item) => item.sourceFinancialYearCode === sourceWorkflow.financialYearCode
  )
  const nextFinancialYear = deriveNextFinancialYear({
    label: sourceWorkflow.financialYearLabel,
  })
  const nominalLedgerCount = ledgers.filter((ledger) =>
    ["income", "expense"].includes(ledger.nature)
  ).length
  const carryForwardLedgerCount = ledgers.filter((ledger) =>
    ["asset", "liability"].includes(ledger.nature)
  ).length
  const journalVoucherCount = vouchers.filter(
    (voucher) =>
      voucher.financialYear.code === sourceWorkflow.financialYearCode &&
      voucher.type === "journal"
  ).length

  const items = [
    {
      controlKey: "close-nominal-ledgers",
      label: "Close nominal ledgers",
      status: nominalLedgerCount > 0 ? ("attention" as const) : ("ready" as const),
      value: String(nominalLedgerCount),
      detail:
        nominalLedgerCount > 0
          ? `${nominalLedgerCount} income and expense ledger(s) should be confirmed in the close pack before carry-forward.`
          : "No nominal ledgers remain for year-end close review.",
      recommendedAction: "Validate journal-based closing adjustments for revenue and expense ledgers.",
    },
    {
      controlKey: "opening-balance-rollover",
      label: "Opening-balance carry forward",
      status:
        rolloverPolicy?.status === "applied"
          ? ("ready" as const)
          : rolloverPolicy
            ? ("attention" as const)
            : ("blocked" as const),
      value: rolloverPolicy?.status ?? "missing",
      detail:
        rolloverPolicy?.status === "applied"
          ? `Opening balances are carried into ${rolloverPolicy.targetFinancialYearLabel}.`
          : rolloverPolicy
            ? "Rollover is prepared but not yet applied."
            : "Opening-balance rollover has not been prepared yet.",
      recommendedAction: "Preview and apply opening-balance rollover before final year-end sign-off.",
    },
    {
      controlKey: "carry-forward-ledgers",
      label: "Carry-forward balance-sheet ledgers",
      status: carryForwardLedgerCount > 0 ? ("ready" as const) : ("blocked" as const),
      value: String(carryForwardLedgerCount),
      detail:
        carryForwardLedgerCount > 0
          ? `${carryForwardLedgerCount} asset and liability ledger(s) are available for carry-forward.`
          : "No carry-forward balance-sheet ledgers were found.",
      recommendedAction: "Validate brought-forward balances for assets, liabilities, cash, bank, and party ledgers.",
    },
    {
      controlKey: "adjustment-journals",
      label: "Year-end adjustment journals",
      status: journalVoucherCount > 0 ? ("ready" as const) : ("attention" as const),
      value: String(journalVoucherCount),
      detail:
        journalVoucherCount > 0
          ? `${journalVoucherCount} journal voucher(s) exist in the source financial year for close review.`
          : "No journal vouchers were found in the source financial year.",
      recommendedAction: "Review depreciation, accrual, provision, and reclassification journals before close approval.",
    },
  ]

  const blockedItemCount = items.filter((item) => item.status === "blocked").length
  const attentionItemCount = items.filter((item) => item.status === "attention").length

  if (parsedPayload.action === "apply" && blockedItemCount > 0) {
    throw new ApplicationError(
      "Year-end controls cannot be applied until blocked carry-forward controls are resolved.",
      {
        financialYearCode: sourceWorkflow.financialYearCode,
        blockedItemCount,
      },
      409
    )
  }

  const timestamp = new Date().toISOString()
  const nextPolicy = billingYearEndAdjustmentControlPolicySchema.parse({
    sourceFinancialYearCode: sourceWorkflow.financialYearCode,
    targetFinancialYearCode: rolloverPolicy?.targetFinancialYearCode ?? nextFinancialYear.code,
    targetFinancialYearLabel: rolloverPolicy?.targetFinancialYearLabel ?? nextFinancialYear.label,
    status: parsedPayload.action === "apply" ? "applied" : "previewed",
    journalVoucherCount,
    nominalLedgerCount,
    carryForwardLedgerCount,
    blockedItemCount,
    attentionItemCount,
    preparedAt: timestamp,
    preparedByUserId: user.id,
    appliedAt: parsedPayload.action === "apply" ? timestamp : null,
    appliedByUserId: parsedPayload.action === "apply" ? user.id : null,
    note: parsedPayload.note,
    items,
  })

  const existing = await readYearEndControls(database)
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
    billingTableNames.yearEndControls,
    nextItems.map((item, index) => ({
      id: `year-end-control:${item.sourceFinancialYearCode}`,
      moduleKey: "year-end-controls",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.preparedAt,
      updatedAt: item.preparedAt,
    }))
  )

  return billingYearEndAdjustmentControlResponseSchema.parse({
    item: nextPolicy,
  })
}

export async function getBillingYearEndAdjustmentControlPolicy(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingViewer(user)
  const items = await readYearEndControls(database)
  return items[0] ?? null
}
