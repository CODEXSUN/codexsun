import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import {
  billingAccountingReportsResponseSchema,
  type BillingBalanceSheetEntry,
  billingLedgerSchema,
  type BillingProfitAndLossEntry,
  billingVoucherSchema,
  type BillingLedgerEntry,
  type BillingLedger,
  type BillingOutstandingItem,
  type BillingVoucher,
} from "../../shared/index.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import { listBillingLedgerEntries } from "./ledger-entry-store.js"
import { listStorePayloads } from "./store.js"

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function toSignedAmount(
  side: BillingLedger["closingSide"],
  amount: number
) {
  return side === "debit" ? amount : -amount
}

function toBalance(amount: number) {
  return {
    side: amount >= 0 ? ("debit" as const) : ("credit" as const),
    amount: roundCurrency(Math.abs(amount)),
  }
}

function toSignedEntryAmount(side: "debit" | "credit", amount: number) {
  return side === "debit" ? amount : -amount
}

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

async function readVouchers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.vouchers, billingVoucherSchema)
}

function getLedgerMovement(entries: BillingLedgerEntry[]) {
  const movementByLedgerId = new Map<
    string,
    {
      debitAmount: number
      creditAmount: number
      signedMovement: number
    }
  >()

  for (const entry of entries) {
    const current = movementByLedgerId.get(entry.ledgerId) ?? {
      debitAmount: 0,
      creditAmount: 0,
      signedMovement: 0,
    }

    if (entry.side === "debit") {
      current.debitAmount += entry.amount
      current.signedMovement += entry.amount
    } else {
      current.creditAmount += entry.amount
      current.signedMovement -= entry.amount
    }

    movementByLedgerId.set(entry.ledgerId, current)
  }

  return movementByLedgerId
}

function getLedgerSourceReferences(entries: BillingLedgerEntry[]) {
  const sourcesByLedgerId = new Map<
    string,
    Map<string, { voucherId: string; voucherNumber: string; entryIds: string[] }>
  >()

  for (const entry of entries) {
    let voucherMap = sourcesByLedgerId.get(entry.ledgerId)

    if (!voucherMap) {
      voucherMap = new Map()
      sourcesByLedgerId.set(entry.ledgerId, voucherMap)
    }

    const existing = voucherMap.get(entry.voucherId)

    if (existing) {
      existing.entryIds.push(entry.entryId)
      continue
    }

    voucherMap.set(entry.voucherId, {
      voucherId: entry.voucherId,
      voucherNumber: entry.voucherNumber,
      entryIds: [entry.entryId],
    })
  }

  return new Map(
    [...sourcesByLedgerId.entries()].map(([ledgerId, voucherMap]) => [
      ledgerId,
      [...voucherMap.values()].sort((left, right) =>
        left.voucherNumber.localeCompare(right.voucherNumber)
      ),
    ])
  )
}

function getInvoiceAmount(voucher: BillingVoucher) {
  if (voucher.gst) {
    return voucher.gst.invoiceAmount
  }

  const debitTotal = voucher.lines
    .filter((line) => line.side === "debit")
    .reduce((sum, line) => sum + line.amount, 0)

  return roundCurrency(debitTotal)
}

export async function getBillingAccountingReports(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingViewer(user)

  const [ledgers, vouchers, ledgerEntries] = await Promise.all([
    readLedgers(database),
    readVouchers(database),
    listBillingLedgerEntries(database).then((response) => response.items),
  ])
  const postedVouchers = vouchers.filter((voucher) => voucher.status === "posted")
  const movementByLedgerId = getLedgerMovement(ledgerEntries)
  const sourceReferencesByLedgerId = getLedgerSourceReferences(ledgerEntries)

  const trialBalanceItems = ledgers
    .map((ledger) => {
      const openingSigned = toSignedAmount(ledger.closingSide, ledger.closingAmount)
      const movement = movementByLedgerId.get(ledger.id) ?? {
        debitAmount: 0,
        creditAmount: 0,
        signedMovement: 0,
      }
      const closingSigned = openingSigned + movement.signedMovement
      const closing = toBalance(closingSigned)

      return {
        ledgerId: ledger.id,
        ledgerName: ledger.name,
        group: ledger.group,
        nature: ledger.nature,
        openingSide: ledger.closingSide,
        openingAmount: roundCurrency(ledger.closingAmount),
        debitAmount: roundCurrency(movement.debitAmount),
        creditAmount: roundCurrency(movement.creditAmount),
        closingSide: closing.side,
        closingAmount: closing.amount,
        sourceReferences: sourceReferencesByLedgerId.get(ledger.id) ?? [],
      }
    })
    .sort((left, right) => left.ledgerName.localeCompare(right.ledgerName))

  const generalLedgerItems = ledgers
    .map((ledger) => {
      const openingSigned = toSignedAmount(ledger.closingSide, ledger.closingAmount)
      const ledgerEntriesForLedger = ledgerEntries
        .filter((entry) => entry.ledgerId === ledger.id)
        .sort((left, right) =>
          left.voucherDate.localeCompare(right.voucherDate) ||
          left.voucherNumber.localeCompare(right.voucherNumber) ||
          left.entryOrder - right.entryOrder
        )

      let runningSigned = openingSigned
      let debitTotal = 0
      let creditTotal = 0

      const entries = ledgerEntriesForLedger.map((entry) => {
        if (entry.side === "debit") {
          debitTotal += entry.amount
        } else {
          creditTotal += entry.amount
        }

        runningSigned += toSignedEntryAmount(entry.side, entry.amount)
        const running = toBalance(runningSigned)

        return {
          entryId: entry.entryId,
          voucherId: entry.voucherId,
          voucherNumber: entry.voucherNumber,
          voucherType: entry.voucherType,
          voucherDate: entry.voucherDate,
          counterparty: entry.counterparty,
          narration: entry.narration,
          side: entry.side,
          amount: roundCurrency(entry.amount),
          runningSide: running.side,
          runningAmount: running.amount,
        }
      })

      const closing = toBalance(runningSigned)

      return {
        ledgerId: ledger.id,
        ledgerName: ledger.name,
        group: ledger.group,
        openingSide: ledger.closingSide,
        openingAmount: roundCurrency(ledger.closingAmount),
        debitTotal: roundCurrency(debitTotal),
        creditTotal: roundCurrency(creditTotal),
        closingSide: closing.side,
        closingAmount: closing.amount,
        entries,
      }
    })
    .sort((left, right) => left.ledgerName.localeCompare(right.ledgerName))

  const profitAndLoss = trialBalanceItems.reduce(
    (result, item) => {
      if (item.nature === "income") {
        result.incomeItems.push({
          ledgerId: item.ledgerId,
          ledgerName: item.ledgerName,
          group: item.group,
          amount: item.closingAmount,
          sourceReferences: item.sourceReferences,
        })
        result.totalIncome += item.closingAmount
      }

      if (item.nature === "expense") {
        result.expenseItems.push({
          ledgerId: item.ledgerId,
          ledgerName: item.ledgerName,
          group: item.group,
          amount: item.closingAmount,
          sourceReferences: item.sourceReferences,
        })
        result.totalExpense += item.closingAmount
      }

      return result
    },
    {
      incomeItems: [] as BillingProfitAndLossEntry[],
      expenseItems: [] as BillingProfitAndLossEntry[],
      totalIncome: 0,
      totalExpense: 0,
    }
  )

  const totalIncome = roundCurrency(profitAndLoss.totalIncome)
  const totalExpense = roundCurrency(profitAndLoss.totalExpense)
  const netProfit = roundCurrency(Math.max(totalIncome - totalExpense, 0))
  const netLoss = roundCurrency(Math.max(totalExpense - totalIncome, 0))

  const balanceSheet = trialBalanceItems.reduce(
    (result, item) => {
      if (item.nature === "asset") {
        result.assetItems.push({
          ledgerId: item.ledgerId,
          ledgerName: item.ledgerName,
          group: item.group,
          amount: item.closingAmount,
          sourceReferences: item.sourceReferences,
        })
        result.totalAssets += item.closingAmount
      }

      if (item.nature === "liability") {
        result.liabilityItems.push({
          ledgerId: item.ledgerId,
          ledgerName: item.ledgerName,
          group: item.group,
          amount: item.closingAmount,
          sourceReferences: item.sourceReferences,
        })
        result.totalLiabilities += item.closingAmount
      }

      return result
    },
    {
      assetItems: [] as BillingBalanceSheetEntry[],
      liabilityItems: [] as BillingBalanceSheetEntry[],
      totalAssets: 0,
      totalLiabilities: 0,
    }
  )

  if (netProfit > 0) {
    balanceSheet.liabilityItems.push({
      ledgerId: "derived-current-period-profit",
      ledgerName: "Current Period Profit",
      group: "Current Earnings",
      amount: netProfit,
      sourceReferences: [],
    })
    balanceSheet.totalLiabilities += netProfit
  } else if (netLoss > 0) {
    balanceSheet.assetItems.push({
      ledgerId: "derived-current-period-loss",
      ledgerName: "Current Period Loss",
      group: "Current Earnings",
      amount: netLoss,
      sourceReferences: [],
    })
    balanceSheet.totalAssets += netLoss
  }

  const outstandingMap = new Map<string, BillingOutstandingItem>()

  for (const voucher of postedVouchers) {
    if (!["sales", "purchase"].includes(voucher.type) || voucher.reversalOfVoucherId) {
      continue
    }

    outstandingMap.set(voucher.voucherNumber, {
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      voucherType: voucher.type === "sales" ? "sales" : "purchase",
      date: voucher.date,
      counterparty: voucher.counterparty,
      originalAmount: getInvoiceAmount(voucher),
      settledAmount: 0,
      outstandingAmount: getInvoiceAmount(voucher),
    })
  }

  for (const voucher of postedVouchers) {
    if (!["payment", "receipt"].includes(voucher.type)) {
      continue
    }

    for (const allocation of voucher.billAllocations) {
      const item = outstandingMap.get(allocation.referenceNumber)

      if (!item) {
        continue
      }

      item.settledAmount = roundCurrency(item.settledAmount + allocation.amount)
      item.outstandingAmount = roundCurrency(
        Math.max(item.originalAmount - item.settledAmount, 0)
      )
    }
  }

  const outstandingItems = [...outstandingMap.values()]
    .filter((item) => item.outstandingAmount > 0)
    .sort((left, right) => left.date.localeCompare(right.date))
  const receivableTotal = roundCurrency(
    outstandingItems
      .filter((item) => item.voucherType === "sales")
      .reduce((sum, item) => sum + item.outstandingAmount, 0)
  )
  const payableTotal = roundCurrency(
    outstandingItems
      .filter((item) => item.voucherType === "purchase")
      .reduce((sum, item) => sum + item.outstandingAmount, 0)
  )

  return billingAccountingReportsResponseSchema.parse({
    item: {
      trialBalance: {
        items: trialBalanceItems,
        debitTotal: roundCurrency(
          trialBalanceItems
            .filter((item) => item.closingSide === "debit")
            .reduce((sum, item) => sum + item.closingAmount, 0)
        ),
        creditTotal: roundCurrency(
          trialBalanceItems
            .filter((item) => item.closingSide === "credit")
            .reduce((sum, item) => sum + item.closingAmount, 0)
        ),
      },
      profitAndLoss: {
        incomeItems: profitAndLoss.incomeItems.sort((left, right) =>
          left.ledgerName.localeCompare(right.ledgerName)
        ),
        expenseItems: profitAndLoss.expenseItems.sort((left, right) =>
          left.ledgerName.localeCompare(right.ledgerName)
        ),
        totalIncome,
        totalExpense,
        netProfit,
        netLoss,
      },
      balanceSheet: {
        assetItems: balanceSheet.assetItems.sort((left, right) =>
          left.ledgerName.localeCompare(right.ledgerName)
        ),
        liabilityItems: balanceSheet.liabilityItems.sort((left, right) =>
          left.ledgerName.localeCompare(right.ledgerName)
        ),
        totalAssets: roundCurrency(balanceSheet.totalAssets),
        totalLiabilities: roundCurrency(balanceSheet.totalLiabilities),
        balanceGap: roundCurrency(
          Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilities)
        ),
      },
      outstanding: {
        receivableTotal,
        payableTotal,
        items: outstandingItems,
      },
      generalLedger: {
        items: generalLedgerItems,
      },
    },
  })
}
