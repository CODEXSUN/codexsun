/**
 * voucher-split-store.ts
 * ──────────────────────
 * Writes denormalized rows into the 9 split voucher-type detail tables and the
 * two book-of-account tables (bank book & cash book).
 *
 * Pattern mirrors voucher-header-store.ts / ledger-entry-store.ts:
 *   - One `toXxxRecord()` mapper per type  →  pure, testable
 *   - One `replaceXxx()` writer per table  →  delete-all then insert
 *   - One `isBankAccount()` / `isCashAccount()` helper for book routing
 *
 * Call `replaceBillingVoucherSplitTables(database, vouchers)` from the same
 * "sync all normalized tables" call-site that already drives
 * `replaceBillingVoucherHeaders` and `replaceBillingLedgerEntries`.
 */

import type { Kysely } from "kysely"
import { nanoid } from "nanoid"

import type { BillingVoucher } from "../../shared/index.js"
import { billingTableNames } from "../../database/table-names.js"

// ─── Internal type alias ──────────────────────────────────────────────────────

type DynamicDatabase = Record<string, Record<string, unknown>>

function asDb(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

// ─── Voucher-type guards ──────────────────────────────────────────────────────

type VoucherType = BillingVoucher["type"]

function isType(voucher: BillingVoucher, ...types: VoucherType[]): boolean {
  return (types as string[]).includes(voucher.type)
}

// ─── Account-class helpers ────────────────────────────────────────────────────
// These are intentionally kept simple / keyword-based.
// Replace with a proper ledger-category lookup if the project adds category
// metadata to BillingVoucher in the future.

function isBankAccount(ledgerName: string): boolean {
  const lc = ledgerName.toLowerCase()
  return (
    lc.includes("bank") ||
    lc.includes("hdfc") ||
    lc.includes("icici") ||
    lc.includes("sbi") ||
    lc.includes("axis") ||
    lc.includes("kotak") ||
    lc.includes("current a/c") ||
    lc.includes("savings a/c")
  )
}

function isCashAccount(ledgerName: string): boolean {
  const lc = ledgerName.toLowerCase()
  return lc.startsWith("cash") || lc === "petty cash" || lc.includes("cash in hand")
}

// ─── GST helpers ─────────────────────────────────────────────────────────────

function gstType(voucher: BillingVoucher): string | null {
  if (!voucher.gst) return null
  return voucher.gst.supplyType === "inter" ? "IGST" : "CGST_SGST"
}

// ─── 1. Sales ─────────────────────────────────────────────────────────────────

type SalesRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  party_ledger_id: string
  party_ledger_name: string
  gross_amount: number
  discount_amount: number
  taxable_amount: number
  tax_amount: number
  net_amount: number
  has_gst: number
  gst_type: string | null
  place_of_supply: string | null
  order_reference: string | null
  dispatch_reference: string | null
  due_date: string | null
  dimension_branch: string | null
  dimension_project: string | null
  dimension_cost_center: string | null
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

function toSalesRow(v: BillingVoucher): SalesRow {
  const sales = v.sales
  const gst = v.gst

  const partyLedgerId = sales?.customerLedgerId ?? gst?.partyLedgerId ?? v.counterparty
  const partyLedgerName = sales?.customerLedgerName ?? gst?.partyLedgerName ?? v.counterparty
  const taxableAmount = gst?.taxableAmount ?? 0
  const taxAmount = gst?.totalTaxAmount ?? 0
  const grossAmount = sales?.subtotal ?? taxableAmount
  const netAmount = sales?.grandTotal ?? (taxableAmount + taxAmount)

  return {
    voucher_id: v.id,
    voucher_number: v.voucherNumber,
    voucher_date: v.date,
    status: v.status,
    party_ledger_id: partyLedgerId,
    party_ledger_name: partyLedgerName,
    gross_amount: Number(grossAmount.toFixed(2)),
    discount_amount: 0,
    taxable_amount: Number(taxableAmount.toFixed(2)),
    tax_amount: Number(taxAmount.toFixed(2)),
    net_amount: Number(netAmount.toFixed(2)),
    has_gst: v.gst ? 1 : 0,
    gst_type: gstType(v),
    place_of_supply: gst?.placeOfSupply ?? null,
    order_reference: sales?.referenceNumber ?? null,
    dispatch_reference: null,
    due_date: sales?.dueDate ?? null,
    dimension_branch: v.dimensions.branch,
    dimension_project: v.dimensions.project,
    dimension_cost_center: v.dimensions.costCenter,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
    created_by_user_id: v.createdByUserId,
  }
}

// ─── 2. Purchase ──────────────────────────────────────────────────────────────

type PurchaseRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  supplier_ledger_id: string
  supplier_ledger_name: string
  supplier_invoice_number: string | null
  supplier_invoice_date: string | null
  gross_amount: number
  discount_amount: number
  taxable_amount: number
  tax_amount: number
  net_amount: number
  has_gst: number
  gst_type: string | null
  itc_eligible: number
  itc_reversal_reason: string | null
  place_of_supply: string | null
  due_date: string | null
  dimension_branch: string | null
  dimension_project: string | null
  dimension_cost_center: string | null
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

function toPurchaseRow(v: BillingVoucher): PurchaseRow {
  const gst = v.gst
  const partyLedgerId = gst?.partyLedgerId ?? v.counterparty
  const partyLedgerName = gst?.partyLedgerName ?? v.counterparty
  const taxableAmount = gst?.taxableAmount ?? 0
  const taxAmount = gst?.totalTaxAmount ?? 0

  return {
    voucher_id: v.id,
    voucher_number: v.voucherNumber,
    voucher_date: v.date,
    status: v.status,
    supplier_ledger_id: partyLedgerId,
    supplier_ledger_name: partyLedgerName,
    supplier_invoice_number: v.sourceDocument?.voucherNumber ?? null,
    supplier_invoice_date: null,
    gross_amount: Number(taxableAmount.toFixed(2)),
    discount_amount: 0,
    taxable_amount: Number(taxableAmount.toFixed(2)),
    tax_amount: Number(taxAmount.toFixed(2)),
    net_amount: Number((taxableAmount + taxAmount).toFixed(2)),
    has_gst: v.gst ? 1 : 0,
    gst_type: gstType(v),
    itc_eligible: 1,
    itc_reversal_reason: null,
    place_of_supply: gst?.placeOfSupply ?? null,
    due_date: null,
    dimension_branch: v.dimensions.branch,
    dimension_project: v.dimensions.project,
    dimension_cost_center: v.dimensions.costCenter,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
    created_by_user_id: v.createdByUserId,
  }
}

// ─── 3. Receipt ───────────────────────────────────────────────────────────────

type ReceiptRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  party_ledger_id: string
  party_ledger_name: string
  payment_mode: string
  bank_ledger_id: string | null
  bank_ledger_name: string | null
  cheque_number: string | null
  cheque_date: string | null
  cheque_bank_name: string | null
  transaction_id: string | null
  receipt_amount: number
  dimension_branch: string | null
  dimension_project: string | null
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

function toReceiptRow(v: BillingVoucher): ReceiptRow {
  // The credit side of a receipt is the party; the debit side is cash/bank.
  const creditLine = v.lines.find((l) => l.side === "credit")
  const debitLine = v.lines.find((l) => l.side === "debit")
  const totalAmount = v.lines
    .filter((l) => l.side === "debit")
    .reduce((s, l) => s + l.amount, 0)

  const bankLine = v.lines.find((l) => l.side === "debit" && isBankAccount(l.ledgerName))
  const mode = bankLine ? "bank" : "cash"

  return {
    voucher_id: v.id,
    voucher_number: v.voucherNumber,
    voucher_date: v.date,
    status: v.status,
    party_ledger_id: creditLine?.ledgerId ?? v.counterparty,
    party_ledger_name: creditLine?.ledgerName ?? v.counterparty,
    payment_mode: mode,
    bank_ledger_id: bankLine?.ledgerId ?? null,
    bank_ledger_name: bankLine?.ledgerName ?? null,
    cheque_number: v.bankReconciliation?.statementReference ?? null,
    cheque_date: null,
    cheque_bank_name: null,
    transaction_id: null,
    receipt_amount: Number(totalAmount.toFixed(2)),
    dimension_branch: v.dimensions.branch,
    dimension_project: v.dimensions.project,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
    created_by_user_id: v.createdByUserId,
  }
}

// ─── 4. Payment ───────────────────────────────────────────────────────────────

type PaymentRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  party_ledger_id: string
  party_ledger_name: string
  payment_mode: string
  bank_ledger_id: string | null
  bank_ledger_name: string | null
  cheque_number: string | null
  cheque_date: string | null
  cheque_bank_name: string | null
  transaction_id: string | null
  payment_amount: number
  tds_amount: number
  tds_section: string | null
  dimension_branch: string | null
  dimension_project: string | null
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

function toPaymentRow(v: BillingVoucher): PaymentRow {
  // Debit side = party being paid; credit side = bank/cash account.
  const debitLine = v.lines.find((l) => l.side === "debit")
  const bankLine = v.lines.find((l) => l.side === "credit" && isBankAccount(l.ledgerName))
  const totalAmount = v.lines
    .filter((l) => l.side === "credit")
    .reduce((s, l) => s + l.amount, 0)
  const mode = bankLine ? "bank" : "cash"

  return {
    voucher_id: v.id,
    voucher_number: v.voucherNumber,
    voucher_date: v.date,
    status: v.status,
    party_ledger_id: debitLine?.ledgerId ?? v.counterparty,
    party_ledger_name: debitLine?.ledgerName ?? v.counterparty,
    payment_mode: mode,
    bank_ledger_id: bankLine?.ledgerId ?? null,
    bank_ledger_name: bankLine?.ledgerName ?? null,
    cheque_number: v.bankReconciliation?.statementReference ?? null,
    cheque_date: null,
    cheque_bank_name: null,
    transaction_id: null,
    payment_amount: Number(totalAmount.toFixed(2)),
    tds_amount: 0,
    tds_section: null,
    dimension_branch: v.dimensions.branch,
    dimension_project: v.dimensions.project,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
    created_by_user_id: v.createdByUserId,
  }
}

// ─── 5. Journal ───────────────────────────────────────────────────────────────

type JournalRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  journal_type: string
  is_auto_generated: number
  auto_generated_reason: string | null
  total_debit: number
  total_credit: number
  dimension_branch: string | null
  dimension_project: string | null
  dimension_cost_center: string | null
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

function toJournalRow(v: BillingVoucher): JournalRow {
  const totalDebit = v.lines
    .filter((l) => l.side === "debit")
    .reduce((s, l) => s + l.amount, 0)
  const totalCredit = v.lines
    .filter((l) => l.side === "credit")
    .reduce((s, l) => s + l.amount, 0)

  return {
    voucher_id: v.id,
    voucher_number: v.voucherNumber,
    voucher_date: v.date,
    status: v.status,
    journal_type: "general",
    is_auto_generated: 0,
    auto_generated_reason: null,
    total_debit: Number(totalDebit.toFixed(2)),
    total_credit: Number(totalCredit.toFixed(2)),
    dimension_branch: v.dimensions.branch,
    dimension_project: v.dimensions.project,
    dimension_cost_center: v.dimensions.costCenter,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
    created_by_user_id: v.createdByUserId,
  }
}

// ─── 6. Contra ────────────────────────────────────────────────────────────────

type ContraRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  contra_type: string
  from_ledger_id: string
  from_ledger_name: string
  to_ledger_id: string
  to_ledger_name: string
  cheque_number: string | null
  cheque_date: string | null
  transaction_id: string | null
  transfer_amount: number
  dimension_branch: string | null
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

function toContraRow(v: BillingVoucher): ContraRow {
  const debitLine = v.lines.find((l) => l.side === "debit")
  const creditLine = v.lines.find((l) => l.side === "credit")
  const fromName = creditLine?.ledgerName ?? ""
  const toName = debitLine?.ledgerName ?? ""

  let contraType = "bank_to_bank"
  if (isCashAccount(fromName) && isBankAccount(toName)) contraType = "cash_to_bank"
  else if (isBankAccount(fromName) && isCashAccount(toName)) contraType = "bank_to_cash"
  else if (isCashAccount(fromName) && isCashAccount(toName)) contraType = "cash_to_cash"

  const transferAmount = v.lines
    .filter((l) => l.side === "debit")
    .reduce((s, l) => s + l.amount, 0)

  return {
    voucher_id: v.id,
    voucher_number: v.voucherNumber,
    voucher_date: v.date,
    status: v.status,
    contra_type: contraType,
    from_ledger_id: creditLine?.ledgerId ?? "",
    from_ledger_name: fromName,
    to_ledger_id: debitLine?.ledgerId ?? "",
    to_ledger_name: toName,
    cheque_number: v.bankReconciliation?.statementReference ?? null,
    cheque_date: null,
    transaction_id: null,
    transfer_amount: Number(transferAmount.toFixed(2)),
    dimension_branch: v.dimensions.branch,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
    created_by_user_id: v.createdByUserId,
  }
}

// ─── 7. Petty Cash ────────────────────────────────────────────────────────────

type PettyCashRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  petty_cash_ledger_id: string
  petty_cash_ledger_name: string
  payee_name: string
  payee_ledger_id: string | null
  payee_ledger_name: string | null
  expense_ledger_id: string
  expense_ledger_name: string
  expense_category: string | null
  expense_amount: number
  bill_number: string | null
  bill_date: string | null
  is_replenishment: number
  replenishment_voucher_id: string | null
  dimension_branch: string | null
  dimension_cost_center: string | null
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

function toPettyCashRow(v: BillingVoucher): PettyCashRow {
  // Credit side = petty cash / cash fund; Debit side = expense
  const cashLine = v.lines.find((l) => l.side === "credit" && isCashAccount(l.ledgerName))
  const expenseLine = v.lines.find((l) => l.side === "debit")

  return {
    voucher_id: v.id,
    voucher_number: v.voucherNumber,
    voucher_date: v.date,
    status: v.status,
    petty_cash_ledger_id: cashLine?.ledgerId ?? "",
    petty_cash_ledger_name: cashLine?.ledgerName ?? "Petty Cash",
    payee_name: v.counterparty,
    payee_ledger_id: null,
    payee_ledger_name: null,
    expense_ledger_id: expenseLine?.ledgerId ?? "",
    expense_ledger_name: expenseLine?.ledgerName ?? "",
    expense_category: null,
    expense_amount: Number((expenseLine?.amount ?? 0).toFixed(2)),
    bill_number: v.sourceDocument?.voucherNumber ?? null,
    bill_date: null,
    is_replenishment: 0,
    replenishment_voucher_id: null,
    dimension_branch: v.dimensions.branch,
    dimension_cost_center: v.dimensions.costCenter,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
    created_by_user_id: v.createdByUserId,
  }
}

// ─── 8. Bank Book entry rows ──────────────────────────────────────────────────

type BankBookRow = {
  entry_id: string
  voucher_id: string
  voucher_number: string
  voucher_date: string
  voucher_type: string
  voucher_status: string
  bank_ledger_id: string
  bank_ledger_name: string
  transaction_side: string
  transaction_amount: number
  running_balance: number
  payment_mode: string | null
  cheque_number: string | null
  cheque_date: string | null
  cheque_bank_name: string | null
  transaction_id: string | null
  value_date: string | null
  counterparty_ledger_id: string | null
  counterparty_ledger_name: string | null
  narration: string
  is_reconciled: number
  reconciled_at: string | null
  bank_statement_ref: string | null
  financial_year_code: string
  dimension_branch: string | null
  created_at: string
  updated_at: string
}

function toBankBookRows(v: BillingVoucher): BankBookRow[] {
  return v.lines
    .filter((l) => isBankAccount(l.ledgerName))
    .map((l) => ({
      entry_id: `bank:${v.id}:${l.id}`,
      voucher_id: v.id,
      voucher_number: v.voucherNumber,
      voucher_date: v.date,
      voucher_type: v.type,
      voucher_status: v.status,
      bank_ledger_id: l.ledgerId,
      bank_ledger_name: l.ledgerName,
      transaction_side: l.side,
      transaction_amount: Number(l.amount.toFixed(2)),
      running_balance: 0, // recalculated on read or background job
      payment_mode: null,
      cheque_number: v.bankReconciliation?.statementReference ?? null,
      cheque_date: null,
      cheque_bank_name: null,
      transaction_id: null,
      value_date: v.bankReconciliation?.clearedDate ?? null,
      counterparty_ledger_id: null,
      counterparty_ledger_name: v.counterparty,
      narration: v.narration,
      is_reconciled:
        v.bankReconciliation?.status === "matched" ||
        v.bankReconciliation?.status === "mismatch"
          ? 1
          : 0,
      reconciled_at: v.bankReconciliation?.clearedDate ?? null,
      bank_statement_ref: v.bankReconciliation?.statementReference ?? null,
      financial_year_code: v.financialYear.code,
      dimension_branch: v.dimensions.branch,
      created_at: v.createdAt,
      updated_at: v.updatedAt,
    }))
}

// ─── 9. Cash Book entry rows ──────────────────────────────────────────────────

type CashBookRow = {
  entry_id: string
  voucher_id: string
  voucher_number: string
  voucher_date: string
  voucher_type: string
  voucher_status: string
  cash_ledger_id: string
  cash_ledger_name: string
  transaction_side: string
  transaction_amount: number
  running_balance: number
  counterparty_ledger_id: string | null
  counterparty_ledger_name: string | null
  narration: string
  is_petty_cash: number
  denomination_json: string | null
  financial_year_code: string
  dimension_branch: string | null
  created_at: string
  updated_at: string
}

function toCashBookRows(v: BillingVoucher): CashBookRow[] {
  const isPettyCash = isType(v, "payment") && v.type === "payment"
    ? v.lines.some((l) => l.side === "credit" && isCashAccount(l.ledgerName))
    : false

  return v.lines
    .filter((l) => isCashAccount(l.ledgerName))
    .map((l) => ({
      entry_id: `cash:${v.id}:${l.id}`,
      voucher_id: v.id,
      voucher_number: v.voucherNumber,
      voucher_date: v.date,
      voucher_type: v.type,
      voucher_status: v.status,
      cash_ledger_id: l.ledgerId,
      cash_ledger_name: l.ledgerName,
      transaction_side: l.side,
      transaction_amount: Number(l.amount.toFixed(2)),
      running_balance: 0, // recalculated on read or background job
      counterparty_ledger_id: null,
      counterparty_ledger_name: v.counterparty,
      narration: v.narration,
      is_petty_cash: isPettyCash ? 1 : 0,
      denomination_json: null,
      financial_year_code: v.financialYear.code,
      dimension_branch: v.dimensions.branch,
      created_at: v.createdAt,
      updated_at: v.updatedAt,
    }))
}

// ─── Table writers ────────────────────────────────────────────────────────────

async function replaceTable<T extends Record<string, unknown>>(
  database: Kysely<unknown>,
  tableName: string,
  rows: T[]
) {
  const db = asDb(database)
  await db.deleteFrom(tableName).execute()
  if (rows.length > 0) {
    await db.insertInto(tableName).values(rows).execute()
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Rebuilds all 9 split voucher-type detail tables and both book-of-account
 * tables from a full voucher list.  Call this alongside
 * `replaceBillingVoucherHeaders` and `replaceBillingLedgerEntries`.
 */
export async function replaceBillingVoucherSplitTables(
  database: Kysely<unknown>,
  vouchers: BillingVoucher[]
) {
  // ── Type-detail tables ───────────────────────────────────────────────────
  await replaceTable(
    database,
    billingTableNames.salesVouchers,
    vouchers
      .filter((v) => isType(v, "sales", "sales_return", "credit_note"))
      .map(toSalesRow)
  )

  await replaceTable(
    database,
    billingTableNames.purchaseVouchers,
    vouchers
      .filter((v) => isType(v, "purchase", "purchase_return", "debit_note"))
      .map(toPurchaseRow)
  )

  await replaceTable(
    database,
    billingTableNames.receiptVouchers,
    vouchers.filter((v) => isType(v, "receipt")).map(toReceiptRow)
  )

  await replaceTable(
    database,
    billingTableNames.paymentVouchers,
    vouchers.filter((v) => isType(v, "payment")).map(toPaymentRow)
  )

  await replaceTable(
    database,
    billingTableNames.journalVouchers,
    vouchers.filter((v) => isType(v, "journal")).map(toJournalRow)
  )

  await replaceTable(
    database,
    billingTableNames.contraVouchers,
    vouchers.filter((v) => isType(v, "contra")).map(toContraRow)
  )

  // Petty cash: payments made from a cash account (heuristic — adjust to
  // a dedicated voucher type if the project adds one).
  await replaceTable(
    database,
    billingTableNames.pettyCashVouchers,
    vouchers
      .filter(
        (v) =>
          isType(v, "payment") &&
          v.lines.some((l) => l.side === "credit" && isCashAccount(l.ledgerName))
      )
      .map(toPettyCashRow)
  )

  // ── Book-of-account tables ───────────────────────────────────────────────
  const bankRows = vouchers.flatMap(toBankBookRows)
  await replaceTable(database, billingTableNames.bankBookEntries, bankRows)

  const cashRows = vouchers.flatMap(toCashBookRows)
  await replaceTable(database, billingTableNames.cashBookEntries, cashRows)
}
