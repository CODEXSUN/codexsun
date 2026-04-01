import type { Kysely } from "kysely"

import type { AuthUser } from "../../../core/shared/index.js"
import {
  billingAccountingReportsResponseSchema,
  billingLedgerSchema,
  billingVoucherSchema,
  type BillingLedger,
  type BillingOutstandingItem,
  type BillingVoucher,
} from "../../shared/index.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
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

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

async function readVouchers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.vouchers, billingVoucherSchema)
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

  const [ledgers, vouchers] = await Promise.all([
    readLedgers(database),
    readVouchers(database),
  ])
  const movementByLedgerId = new Map<
    string,
    {
      debitAmount: number
      creditAmount: number
      signedMovement: number
    }
  >()

  for (const voucher of vouchers) {
    for (const line of voucher.lines) {
      const current = movementByLedgerId.get(line.ledgerId) ?? {
        debitAmount: 0,
        creditAmount: 0,
        signedMovement: 0,
      }

      if (line.side === "debit") {
        current.debitAmount += line.amount
        current.signedMovement += line.amount
      } else {
        current.creditAmount += line.amount
        current.signedMovement -= line.amount
      }

      movementByLedgerId.set(line.ledgerId, current)
    }
  }

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
        })
        result.totalIncome += item.closingAmount
      }

      if (item.nature === "expense") {
        result.expenseItems.push({
          ledgerId: item.ledgerId,
          ledgerName: item.ledgerName,
          group: item.group,
          amount: item.closingAmount,
        })
        result.totalExpense += item.closingAmount
      }

      return result
    },
    {
      incomeItems: [] as Array<{
        ledgerId: string
        ledgerName: string
        group: string
        amount: number
      }>,
      expenseItems: [] as Array<{
        ledgerId: string
        ledgerName: string
        group: string
        amount: number
      }>,
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
        })
        result.totalAssets += item.closingAmount
      }

      if (item.nature === "liability") {
        result.liabilityItems.push({
          ledgerId: item.ledgerId,
          ledgerName: item.ledgerName,
          group: item.group,
          amount: item.closingAmount,
        })
        result.totalLiabilities += item.closingAmount
      }

      return result
    },
    {
      assetItems: [] as Array<{
        ledgerId: string
        ledgerName: string
        group: string
        amount: number
      }>,
      liabilityItems: [] as Array<{
        ledgerId: string
        ledgerName: string
        group: string
        amount: number
      }>,
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
    })
    balanceSheet.totalLiabilities += netProfit
  } else if (netLoss > 0) {
    balanceSheet.assetItems.push({
      ledgerId: "derived-current-period-loss",
      ledgerName: "Current Period Loss",
      group: "Current Earnings",
      amount: netLoss,
    })
    balanceSheet.totalAssets += netLoss
  }

  const outstandingMap = new Map<string, BillingOutstandingItem>()

  for (const voucher of vouchers) {
    if (!["sales", "purchase"].includes(voucher.type)) {
      continue
    }

    outstandingMap.set(voucher.voucherNumber, {
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      voucherType: voucher.type,
      date: voucher.date,
      counterparty: voucher.counterparty,
      originalAmount: getInvoiceAmount(voucher),
      settledAmount: 0,
      outstandingAmount: getInvoiceAmount(voucher),
    })
  }

  for (const voucher of vouchers) {
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
    },
  })
}
