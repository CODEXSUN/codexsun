import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../core/shared/index.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  billingVoucherEInvoiceSchema,
  billingVoucherEWayBillSchema,
  billingLedgerSchema,
  billingVoucherGstSchema,
  billingVoucherListResponseSchema,
  billingVoucherResponseSchema,
  billingVoucherSchema,
  billingVoucherUpsertPayloadSchema,
  type BillingVoucher,
  type BillingVoucherGst,
} from "../../shared/index.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import {
  createVoucherNumber,
  generateEInvoiceRecord,
  generateEWayBillRecord,
  getVoucherPrefix,
  resolveFinancialYear,
  validateBillAllocations,
} from "./compliance-service.js"
import {
  getStorePayloadById,
  listStorePayloads,
  replaceStorePayloads,
} from "./store.js"

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

async function readVouchers(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    billingTableNames.vouchers,
    billingVoucherSchema
  )

  return items.sort((left, right) =>
    right.date.localeCompare(left.date) ||
    right.updatedAt.localeCompare(left.updatedAt)
  )
}

function getVoucherTotals(voucher: Pick<BillingVoucher, "lines">) {
  return voucher.lines.reduce(
    (totals, line) => {
      if (line.side === "debit") {
        totals.debit += line.amount
      } else {
        totals.credit += line.amount
      }

      return totals
    },
    { credit: 0, debit: 0 }
  )
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function getRequiredTaxLedgerIds(
  voucherType: BillingVoucher["type"],
  supplyType: BillingVoucherGst["supplyType"]
) {
  if (voucherType === "sales") {
    return supplyType === "intra"
      ? ["ledger-output-cgst", "ledger-output-sgst"]
      : ["ledger-output-igst"]
  }

  return supplyType === "intra"
    ? ["ledger-input-cgst", "ledger-input-sgst"]
    : ["ledger-input-igst"]
}

function buildAutoPostedGst(
  voucherType: BillingVoucher["type"],
  gstPayload: NonNullable<ReturnType<typeof billingVoucherUpsertPayloadSchema.parse>["gst"]>,
  ledgerMap: Map<string, Awaited<ReturnType<typeof readLedgers>>[number]>
) {
  if (!["sales", "purchase"].includes(voucherType)) {
    throw new ApplicationError(
      "GST auto-posting is available only for sales and purchase vouchers.",
      { voucherType },
      400
    )
  }

  const taxableLedger = ledgerMap.get(gstPayload.taxableLedgerId)
  const partyLedger = ledgerMap.get(gstPayload.partyLedgerId)

  if (!taxableLedger) {
    throw new ApplicationError(
      "GST taxable ledger could not be found.",
      { ledgerId: gstPayload.taxableLedgerId },
      400
    )
  }

  if (!partyLedger) {
    throw new ApplicationError(
      "GST party ledger could not be found.",
      { ledgerId: gstPayload.partyLedgerId },
      400
    )
  }

  const expectedTaxDirection = voucherType === "sales" ? "output" : "input"
  const taxRate = gstPayload.taxRate
  const taxableAmount = roundCurrency(gstPayload.taxableAmount)
  const totalTaxAmount = roundCurrency((taxableAmount * taxRate) / 100)
  const cgstAmount =
    gstPayload.supplyType === "intra" ? roundCurrency(totalTaxAmount / 2) : 0
  const sgstAmount =
    gstPayload.supplyType === "intra" ? roundCurrency(totalTaxAmount / 2) : 0
  const igstAmount =
    gstPayload.supplyType === "inter" ? roundCurrency(totalTaxAmount) : 0
  const invoiceAmount = roundCurrency(taxableAmount + totalTaxAmount)

  const taxLedgerIds = getRequiredTaxLedgerIds(voucherType, gstPayload.supplyType)
  const taxLines = taxLedgerIds.map((ledgerId) => {
    const ledger = ledgerMap.get(ledgerId)

    if (!ledger) {
      throw new ApplicationError(
        "Configured GST tax ledger could not be found.",
        { ledgerId },
        500
      )
    }

    const amount =
      ledgerId.includes("cgst")
        ? cgstAmount
        : ledgerId.includes("sgst")
          ? sgstAmount
          : igstAmount

    return {
      ledger,
      amount,
    }
  }).filter((entry) => entry.amount > 0)

  const lines =
    voucherType === "sales"
      ? [
          {
            id: `voucher-line:${randomUUID()}`,
            ledgerId: partyLedger.id,
            ledgerName: partyLedger.name,
            side: "debit" as const,
            amount: invoiceAmount,
            note: "Customer or cash ledger raised for the GST invoice amount.",
          },
          {
            id: `voucher-line:${randomUUID()}`,
            ledgerId: taxableLedger.id,
            ledgerName: taxableLedger.name,
            side: "credit" as const,
            amount: taxableAmount,
            note: "Taxable value credited to the sales ledger.",
          },
          ...taxLines.map((entry) => ({
            id: `voucher-line:${randomUUID()}`,
            ledgerId: entry.ledger.id,
            ledgerName: entry.ledger.name,
            side: "credit" as const,
            amount: entry.amount,
            note: `${entry.ledger.name} auto-posted from GST rate calculation.`,
          })),
        ]
      : [
          {
            id: `voucher-line:${randomUUID()}`,
            ledgerId: taxableLedger.id,
            ledgerName: taxableLedger.name,
            side: "debit" as const,
            amount: taxableAmount,
            note: "Taxable value debited to the purchase ledger.",
          },
          ...taxLines.map((entry) => ({
            id: `voucher-line:${randomUUID()}`,
            ledgerId: entry.ledger.id,
            ledgerName: entry.ledger.name,
            side: "debit" as const,
            amount: entry.amount,
            note: `${entry.ledger.name} auto-posted as input tax credit.`,
          })),
          {
            id: `voucher-line:${randomUUID()}`,
            ledgerId: partyLedger.id,
            ledgerName: partyLedger.name,
            side: "credit" as const,
            amount: invoiceAmount,
            note: "Supplier ledger credited for the GST bill amount.",
          },
        ]

  const gst = billingVoucherGstSchema.parse({
    supplyType: gstPayload.supplyType,
    taxDirection: expectedTaxDirection,
    placeOfSupply: gstPayload.placeOfSupply,
    partyGstin: gstPayload.partyGstin,
    hsnOrSac: gstPayload.hsnOrSac,
    taxableAmount,
    taxRate,
    taxableLedgerId: taxableLedger.id,
    taxableLedgerName: taxableLedger.name,
    partyLedgerId: partyLedger.id,
    partyLedgerName: partyLedger.name,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTaxAmount,
    invoiceAmount,
  })

  return {
    gst,
    lines,
  }
}

async function buildVoucherRecord(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  payload: unknown,
  existing?: BillingVoucher
) {
  assertBillingViewer(user)

  const parsedPayload = billingVoucherUpsertPayloadSchema.parse(payload)
  const ledgers = await readLedgers(database)
  const ledgerMap = new Map(ledgers.map((ledger) => [ledger.id, ledger]))
  const normalizedVoucherNumber = parsedPayload.voucherNumber.trim().toLowerCase()
  const existingVouchers = await readVouchers(database)
  const duplicateVoucher = existingVouchers.find(
    (voucher) =>
      voucher.id !== existing?.id &&
      normalizedVoucherNumber.length > 0 &&
      voucher.voucherNumber.trim().toLowerCase() === normalizedVoucherNumber
  )

  if (duplicateVoucher) {
    throw new ApplicationError(
      "Voucher number already exists.",
      { voucherNumber: parsedPayload.voucherNumber },
      409
    )
  }

  const normalizedManualLines = parsedPayload.lines.map((line) => {
    const ledger = ledgerMap.get(line.ledgerId)

    if (!ledger) {
      throw new ApplicationError(
        "Voucher line ledger could not be found.",
        { ledgerId: line.ledgerId },
        400
      )
    }

    return {
      id: existing?.lines.find(
        (candidate) =>
          candidate.ledgerId === line.ledgerId &&
          candidate.side === line.side &&
          candidate.note === line.note &&
          candidate.amount === line.amount
      )?.id ?? `voucher-line:${randomUUID()}`,
      ledgerId: ledger.id,
      ledgerName: ledger.name,
      side: line.side,
      amount: line.amount,
      note: line.note,
    }
  })

  const autoPosted =
    parsedPayload.gst !== null
      ? buildAutoPostedGst(parsedPayload.type, parsedPayload.gst, ledgerMap)
      : null

  if (parsedPayload.gst === null && normalizedManualLines.length < 2) {
    throw new ApplicationError(
      "At least two voucher lines are required for non-GST vouchers.",
      {},
      400
    )
  }

  const lines = autoPosted?.lines ?? normalizedManualLines
  const gst = autoPosted?.gst ?? null
  const settlementAmount =
    lines.find((line) =>
      parsedPayload.type === "receipt"
        ? line.side === "debit"
        : parsedPayload.type === "payment"
          ? line.side === "credit"
          : false
    )?.amount ?? 0

  try {
    validateBillAllocations(
      parsedPayload.type,
      parsedPayload.billAllocations,
      settlementAmount
    )
  } catch (error) {
    throw new ApplicationError(
      error instanceof Error ? error.message : "Invalid bill allocations.",
      {},
      400
    )
  }

  const totals = getVoucherTotals({ lines })

  if (totals.debit <= 0 || totals.credit <= 0) {
    throw new ApplicationError(
      "Both debit and credit totals must be greater than zero.",
      totals,
      400
    )
  }

  if (totals.debit !== totals.credit) {
    throw new ApplicationError(
      "Voucher is not balanced. Debit and credit totals must match.",
      totals,
      400
    )
  }

  const timestamp = new Date().toISOString()
  const fyBase = resolveFinancialYear(parsedPayload.date, config)
  const prefix = getVoucherPrefix(parsedPayload.type)
  const sequenceNumber =
    existing?.financialYear.sequenceNumber ??
    existingVouchers.filter((voucher) => voucher.financialYear.code === fyBase.code && voucher.type === parsedPayload.type).length + 1
  const financialYear = {
    ...fyBase,
    sequenceNumber,
    prefix,
  }
  const voucherNumber =
    parsedPayload.voucherNumber.trim() || createVoucherNumber(parsedPayload.type, financialYear)

  const baseRecord = {
    id: existing?.id ?? `voucher:${randomUUID()}`,
    voucherNumber,
    type: parsedPayload.type,
    date: parsedPayload.date,
    counterparty: parsedPayload.counterparty,
    narration: parsedPayload.narration,
    lines,
    gst,
    financialYear,
    billAllocations: parsedPayload.billAllocations.map((allocation) => ({
      id:
        existing?.billAllocations.find(
          (candidate) => candidate.referenceNumber === allocation.referenceNumber
        )?.id ?? `bill-allocation:${randomUUID()}`,
      referenceType: allocation.referenceType,
      referenceNumber: allocation.referenceNumber,
      referenceDate: allocation.referenceDate,
      dueDate: allocation.dueDate,
      amount: allocation.amount,
      note: allocation.note,
    })),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    createdByUserId: existing?.createdByUserId ?? user.id,
  }

  const eInvoice = billingVoucherEInvoiceSchema.parse(
    parsedPayload.generateEInvoice
      ? await generateEInvoiceRecord(
          billingVoucherSchema.parse({
            ...baseRecord,
            eInvoice: existing?.eInvoice ?? {
              status: "pending",
              irn: null,
              ackNo: null,
              ackDate: null,
              qrCodePayload: null,
              signedInvoice: null,
              generatedAt: null,
              errorMessage: null,
            },
            eWayBill: existing?.eWayBill ?? {
              status: "pending",
              ewayBillNo: null,
              ewayBillDate: null,
              validUpto: null,
              distanceKm: null,
              vehicleNumber: null,
              transporterId: null,
              generatedAt: null,
              errorMessage: null,
            },
          }),
          config
        )
      : existing?.eInvoice ?? {
          status: "not_applicable",
          irn: null,
          ackNo: null,
          ackDate: null,
          qrCodePayload: null,
          signedInvoice: null,
          generatedAt: null,
          errorMessage: null,
        }
  )
  const eWayBill = billingVoucherEWayBillSchema.parse(
    parsedPayload.generateEWayBill
      ? await generateEWayBillRecord(
          billingVoucherSchema.parse({
            ...baseRecord,
            eInvoice,
            eWayBill: existing?.eWayBill ?? {
              status: "pending",
              ewayBillNo: null,
              ewayBillDate: null,
              validUpto: null,
              distanceKm: null,
              vehicleNumber: null,
              transporterId: null,
              generatedAt: null,
              errorMessage: null,
            },
          }),
          config,
          parsedPayload.transport
        )
      : existing?.eWayBill ?? {
          status: "not_applicable",
          ewayBillNo: null,
          ewayBillDate: null,
          validUpto: null,
          distanceKm: null,
          vehicleNumber: null,
          transporterId: null,
          generatedAt: null,
          errorMessage: null,
        }
  )

  return billingVoucherSchema.parse({
    ...baseRecord,
    eInvoice,
    eWayBill,
  })
}

export async function listBillingVouchers(
  database: Kysely<unknown>,
  user: AuthUser,
  type?: BillingVoucher["type"]
) {
  assertBillingViewer(user)

  return billingVoucherListResponseSchema.parse({
    items: (await readVouchers(database)).filter((item) =>
      type ? item.type === type : true
    ),
  })
}

export async function getBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  voucherId: string
) {
  assertBillingViewer(user)

  const item = await getStorePayloadById(
    database,
    billingTableNames.vouchers,
    voucherId,
    billingVoucherSchema
  )

  if (!item) {
    throw new ApplicationError("Billing voucher could not be found.", { voucherId }, 404)
  }

  return billingVoucherResponseSchema.parse({
    item,
  })
}

export async function createBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  payload: unknown
) {
  const createdItem = await buildVoucherRecord(database, user, config, payload)
  const items = await readVouchers(database)
  const nextItems = [createdItem, ...items].sort((left, right) =>
    right.date.localeCompare(left.date) ||
    right.updatedAt.localeCompare(left.updatedAt)
  )

  await replaceStorePayloads(
    database,
    billingTableNames.vouchers,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "vouchers",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  return billingVoucherResponseSchema.parse({
    item: createdItem,
  })
}

export async function updateBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  voucherId: string,
  payload: unknown
) {
  const items = await readVouchers(database)
  const existingItem = items.find((item) => item.id === voucherId)

  if (!existingItem) {
    throw new ApplicationError("Billing voucher could not be found.", { voucherId }, 404)
  }

  const updatedItem = await buildVoucherRecord(
    database,
    user,
    config,
    payload,
    existingItem
  )
  const nextItems = items
    .map((item) => (item.id === voucherId ? updatedItem : item))
    .sort((left, right) =>
      right.date.localeCompare(left.date) ||
      right.updatedAt.localeCompare(left.updatedAt)
    )

  await replaceStorePayloads(
    database,
    billingTableNames.vouchers,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "vouchers",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  return billingVoucherResponseSchema.parse({
    item: updatedItem,
  })
}

export async function deleteBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  voucherId: string
) {
  assertBillingViewer(user)

  const items = await readVouchers(database)
  const nextItems = items.filter((item) => item.id !== voucherId)

  if (nextItems.length === items.length) {
    throw new ApplicationError("Billing voucher could not be found.", { voucherId }, 404)
  }

  await replaceStorePayloads(
    database,
    billingTableNames.vouchers,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "vouchers",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  return {
    deleted: true as const,
    id: voucherId,
  }
}
