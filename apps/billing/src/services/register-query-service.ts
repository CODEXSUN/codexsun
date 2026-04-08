import type { Kysely } from "kysely"

import { billingTableNames } from "../../database/table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

type RegisterModule =
  | "sales"
  | "purchase"
  | "receipt"
  | "payment"
  | "journal"
  | "contra"

type SalesVoucherRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  party_ledger_name: string
  net_amount: number
}

type PurchaseVoucherRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  supplier_ledger_name: string
  net_amount: number
}

type ReceiptVoucherRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  party_ledger_name: string
  receipt_amount: number
  payment_mode: string
}

type PaymentVoucherRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  party_ledger_name: string
  payment_amount: number
  payment_mode: string
}

type JournalVoucherRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  total_debit: number
  total_credit: number
}

type ContraVoucherRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  contra_type: string
  transfer_amount: number
}

type VoucherHeaderRow = {
  voucher_id: string
  narration: string
  counterparty: string
}

type RegisterSummaryItem = {
  voucherId: string
  voucherNumber: string
  voucherDate: string
  status: string
  counterparty: string
  narration: string
  amount: number
  itemCount: number
  mode: string | null
  subtype: string | null
}

function asDb(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

async function readHeaders(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.voucherHeaders)
    .select(["voucher_id", "narration", "counterparty"])
    .execute()) as VoucherHeaderRow[]
}

function buildHeaderMap(rows: VoucherHeaderRow[]) {
  return new Map(rows.map((row) => [row.voucher_id, row]))
}

export async function listBillingRegisterSummaries(
  database: Kysely<unknown>,
  module: RegisterModule
) {
  const headers = buildHeaderMap(await readHeaders(database))
  const db = asDb(database)

  if (module === "sales") {
    const vouchers = (await db
      .selectFrom(billingTableNames.salesVouchers)
      .select(["voucher_id", "voucher_number", "voucher_date", "status", "party_ledger_name", "net_amount"])
      .execute()) as SalesVoucherRow[]
    const items = await db
      .selectFrom(billingTableNames.salesItemVouchers)
      .select(["voucher_id"])
      .execute()
    const itemCountByVoucherId = new Map<string, number>()
    for (const item of items) {
      const voucherId = String(item.voucher_id)
      itemCountByVoucherId.set(voucherId, (itemCountByVoucherId.get(voucherId) ?? 0) + 1)
    }
    return {
      items: vouchers.map((voucher) => ({
        voucherId: voucher.voucher_id,
        voucherNumber: voucher.voucher_number,
        voucherDate: voucher.voucher_date,
        status: voucher.status,
        counterparty: voucher.party_ledger_name,
        narration: headers.get(voucher.voucher_id)?.narration ?? "",
        amount: voucher.net_amount,
        itemCount: itemCountByVoucherId.get(voucher.voucher_id) ?? 0,
        mode: null,
        subtype: "sales",
      })),
    }
  }

  if (module === "purchase") {
    const vouchers = (await db
      .selectFrom(billingTableNames.purchaseVouchers)
      .select(["voucher_id", "voucher_number", "voucher_date", "status", "supplier_ledger_name", "net_amount"])
      .execute()) as PurchaseVoucherRow[]
    const items = await db
      .selectFrom(billingTableNames.purchaseItemVouchers)
      .select(["voucher_id"])
      .execute()
    const itemCountByVoucherId = new Map<string, number>()
    for (const item of items) {
      const voucherId = String(item.voucher_id)
      itemCountByVoucherId.set(voucherId, (itemCountByVoucherId.get(voucherId) ?? 0) + 1)
    }
    return {
      items: vouchers.map((voucher) => ({
        voucherId: voucher.voucher_id,
        voucherNumber: voucher.voucher_number,
        voucherDate: voucher.voucher_date,
        status: voucher.status,
        counterparty: voucher.supplier_ledger_name,
        narration: headers.get(voucher.voucher_id)?.narration ?? "",
        amount: voucher.net_amount,
        itemCount: itemCountByVoucherId.get(voucher.voucher_id) ?? 0,
        mode: null,
        subtype: "purchase",
      })),
    }
  }

  if (module === "receipt") {
    const vouchers = (await db
      .selectFrom(billingTableNames.receiptVouchers)
      .select(["voucher_id", "voucher_number", "voucher_date", "status", "party_ledger_name", "receipt_amount", "payment_mode"])
      .execute()) as ReceiptVoucherRow[]
    const items = await db
      .selectFrom(billingTableNames.receiptItemVouchers)
      .select(["voucher_id"])
      .execute()
    const itemCountByVoucherId = new Map<string, number>()
    for (const item of items) {
      const voucherId = String(item.voucher_id)
      itemCountByVoucherId.set(voucherId, (itemCountByVoucherId.get(voucherId) ?? 0) + 1)
    }
    return {
      items: vouchers.map((voucher) => ({
        voucherId: voucher.voucher_id,
        voucherNumber: voucher.voucher_number,
        voucherDate: voucher.voucher_date,
        status: voucher.status,
        counterparty: voucher.party_ledger_name,
        narration: headers.get(voucher.voucher_id)?.narration ?? "",
        amount: voucher.receipt_amount,
        itemCount: itemCountByVoucherId.get(voucher.voucher_id) ?? 0,
        mode: voucher.payment_mode,
        subtype: "receipt",
      })),
    }
  }

  if (module === "payment") {
    const vouchers = (await db
      .selectFrom(billingTableNames.paymentVouchers)
      .select(["voucher_id", "voucher_number", "voucher_date", "status", "party_ledger_name", "payment_amount", "payment_mode"])
      .execute()) as PaymentVoucherRow[]
    const items = await db
      .selectFrom(billingTableNames.paymentItemVouchers)
      .select(["voucher_id"])
      .execute()
    const itemCountByVoucherId = new Map<string, number>()
    for (const item of items) {
      const voucherId = String(item.voucher_id)
      itemCountByVoucherId.set(voucherId, (itemCountByVoucherId.get(voucherId) ?? 0) + 1)
    }
    return {
      items: vouchers.map((voucher) => ({
        voucherId: voucher.voucher_id,
        voucherNumber: voucher.voucher_number,
        voucherDate: voucher.voucher_date,
        status: voucher.status,
        counterparty: voucher.party_ledger_name,
        narration: headers.get(voucher.voucher_id)?.narration ?? "",
        amount: voucher.payment_amount,
        itemCount: itemCountByVoucherId.get(voucher.voucher_id) ?? 0,
        mode: voucher.payment_mode,
        subtype: "payment",
      })),
    }
  }

  if (module === "journal") {
    const vouchers = (await db
      .selectFrom(billingTableNames.journalVouchers)
      .select(["voucher_id", "voucher_number", "voucher_date", "status", "total_debit", "total_credit"])
      .execute()) as JournalVoucherRow[]
    const items = await db
      .selectFrom(billingTableNames.journalItemVouchers)
      .select(["voucher_id"])
      .execute()
    const itemCountByVoucherId = new Map<string, number>()
    for (const item of items) {
      const voucherId = String(item.voucher_id)
      itemCountByVoucherId.set(voucherId, (itemCountByVoucherId.get(voucherId) ?? 0) + 1)
    }
    return {
      items: vouchers.map((voucher) => ({
        voucherId: voucher.voucher_id,
        voucherNumber: voucher.voucher_number,
        voucherDate: voucher.voucher_date,
        status: voucher.status,
        counterparty: headers.get(voucher.voucher_id)?.counterparty ?? "",
        narration: headers.get(voucher.voucher_id)?.narration ?? "",
        amount: voucher.total_debit,
        itemCount: itemCountByVoucherId.get(voucher.voucher_id) ?? 0,
        mode: null,
        subtype: "journal",
      })),
    }
  }

  const vouchers = (await db
    .selectFrom(billingTableNames.contraVouchers)
    .select(["voucher_id", "voucher_number", "voucher_date", "status", "contra_type", "transfer_amount"])
    .execute()) as ContraVoucherRow[]
  const items = await db
    .selectFrom(billingTableNames.contraItemVouchers)
    .select(["voucher_id"])
    .execute()
  const itemCountByVoucherId = new Map<string, number>()
  for (const item of items) {
    const voucherId = String(item.voucher_id)
    itemCountByVoucherId.set(voucherId, (itemCountByVoucherId.get(voucherId) ?? 0) + 1)
  }
  return {
    items: vouchers.map((voucher) => ({
      voucherId: voucher.voucher_id,
      voucherNumber: voucher.voucher_number,
      voucherDate: voucher.voucher_date,
      status: voucher.status,
      counterparty: headers.get(voucher.voucher_id)?.counterparty ?? "",
      narration: headers.get(voucher.voucher_id)?.narration ?? "",
      amount: voucher.transfer_amount,
      itemCount: itemCountByVoucherId.get(voucher.voucher_id) ?? 0,
      mode: null,
      subtype: voucher.contra_type,
    })),
  }
}
