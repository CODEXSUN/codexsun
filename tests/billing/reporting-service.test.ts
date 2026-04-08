import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getBillingAccountingReports } from "../../apps/billing/src/services/reporting-service.js"
import { replaceBillingLedgerEntries } from "../../apps/billing/src/services/ledger-entry-store.js"
import {
  createBillingVoucher,
  reconcileBillingVoucher,
  reverseBillingVoucher,
} from "../../apps/billing/src/services/voucher-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

const adminUser = {
  id: "auth-user:platform-admin",
  email: "sundar@sundar.com",
  phoneNumber: "9999999999",
  displayName: "Sundar",
  actorType: "admin" as const,
  isSuperAdmin: true,
  avatarUrl: null,
  isActive: true,
  organizationName: "Codexsun",
  roles: [],
  permissions: [],
  createdAt: "2026-03-30T00:00:00.000Z",
  updatedAt: "2026-03-30T00:00:00.000Z",
}

test("billing reporting service derives trial balance and outstanding from posted books", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-reporting-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "RCPT-2026-101",
        type: "receipt",
        date: "2026-04-02",
        counterparty: "Maya Fashion House",
        narration: "Receipt adjusted against a sales invoice.",
        lines: [
          {
            ledgerId: "ledger-hdfc",
            side: "debit",
            amount: 34400,
            note: "Bank collection received.",
          },
          {
            ledgerId: "ledger-sundry-debtors",
            side: "credit",
            amount: 34400,
            note: "Customer account settled.",
          },
        ],
        billAllocations: [
          {
            referenceType: "against_ref",
            referenceNumber: "SAL-2026-001",
            referenceDate: "2026-03-24",
            dueDate: "2026-04-15",
            amount: 34400,
            note: "Partial settlement",
          },
        ],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const salesOutstanding = reports.item.outstanding.items.find(
        (item) => item.voucherNumber === "SAL-2026-001"
      )
      const salesLedger = reports.item.trialBalance.items.find(
        (item) => item.ledgerId === "ledger-sales"
      )
      const salesGeneralLedger = reports.item.generalLedger.items.find(
        (item) => item.ledgerId === "ledger-sales"
      )

      assert.ok(salesLedger)
      assert.ok(salesGeneralLedger)
      assert.equal(salesLedger.creditAmount > 0, true)
      assert.equal(salesLedger.sourceReferences.some((item) => item.voucherId === "voucher-sales-001"), true)
      assert.equal(salesGeneralLedger.entries.some((item) => item.voucherId === "voucher-sales-001"), true)
      assert.equal(reports.item.profitAndLoss.totalIncome > 0, true)
      assert.equal(
        reports.item.profitAndLoss.incomeItems.some(
          (item) =>
            item.ledgerId === "ledger-sales" &&
            item.sourceReferences.some((source) => source.voucherId === "voucher-sales-001")
        ),
        true
      )
      assert.ok(salesOutstanding)
      assert.equal(salesOutstanding.settledAmount, 98400)
      assert.equal(salesOutstanding.outstandingAmount, 36000)
      assert.equal(reports.item.outstanding.receivableTotal >= 36000, true)

      await reverseBillingVoucher(runtime.primary, adminUser, config, "voucher-sales-001", {
        reason: "Original invoice reversed for accounting correction.",
      })

      const reportsAfterReverse = await getBillingAccountingReports(runtime.primary, adminUser)
      const reversedOutstanding = reportsAfterReverse.item.outstanding.items.find(
        (item) => item.voucherNumber === "SAL-2026-001"
      )

      assert.equal(reversedOutstanding, undefined)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service derives movement from normalized ledger entries", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-reporting-entries-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-730",
        status: "posted",
        type: "journal",
        date: "2026-04-14",
        counterparty: "Reporting Entry Counterparty",
        narration: "Posted journal to drive movement.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 2500,
            note: "Expense booked.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 2500,
            note: "Liability booked.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reportsBeforeReset = await getBillingAccountingReports(runtime.primary, adminUser)
      const rentLedgerBeforeReset = reportsBeforeReset.item.trialBalance.items.find(
        (item) => item.ledgerId === "ledger-rent"
      )

      assert.ok(rentLedgerBeforeReset)
      assert.equal(rentLedgerBeforeReset.debitAmount >= 2500, true)

      await replaceBillingLedgerEntries(runtime.primary, [])

      const reportsAfterReset = await getBillingAccountingReports(runtime.primary, adminUser)
      const rentLedgerAfterReset = reportsAfterReset.item.trialBalance.items.find(
        (item) => item.ledgerId === "ledger-rent"
      )
      const rentGeneralLedgerAfterReset = reportsAfterReset.item.generalLedger.items.find(
        (item) => item.ledgerId === "ledger-rent"
      )

      assert.ok(rentLedgerAfterReset)
      assert.ok(rentGeneralLedgerAfterReset)
      assert.equal(rentLedgerAfterReset.debitAmount, 0)
      assert.equal(rentLedgerAfterReset.creditAmount, 0)
      assert.deepEqual(rentLedgerAfterReset.sourceReferences, [])
      assert.deepEqual(rentGeneralLedgerAfterReset.entries, [])
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service builds a running general ledger from posted entries", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-general-ledger-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-801",
        status: "posted",
        type: "journal",
        date: "2026-04-14",
        counterparty: "General Ledger Counterparty",
        narration: "Expense accrual one.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 1000,
            note: "Rent debit one.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 1000,
            note: "Creditor credit one.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-802",
        status: "posted",
        type: "journal",
        date: "2026-04-15",
        counterparty: "General Ledger Counterparty",
        narration: "Expense accrual two.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 1500,
            note: "Rent debit two.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 1500,
            note: "Creditor credit two.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const rentLedger = reports.item.generalLedger.items.find(
        (item) => item.ledgerId === "ledger-rent"
      )

      assert.ok(rentLedger)
      assert.equal(rentLedger.entries.filter((item) => item.voucherNumber === "JRN-2026-801").length, 1)
      assert.equal(rentLedger.entries.filter((item) => item.voucherNumber === "JRN-2026-802").length, 1)
      assert.equal(rentLedger.entries.length >= 2, true)
      assert.equal(rentLedger.debitTotal >= 2500, true)
      assert.equal(rentLedger.creditTotal, 0)
      const createdEntries = rentLedger.entries.filter((item) =>
        ["JRN-2026-801", "JRN-2026-802"].includes(item.voucherNumber)
      )
      assert.equal(createdEntries[0]?.runningAmount > 0, true)
      assert.equal(
        createdEntries[1]?.runningAmount >= createdEntries[0]!.runningAmount,
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service builds bank book from bank ledgers only", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-bank-book-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "CNT-2026-920",
        status: "posted",
        type: "contra",
        date: "2026-04-18",
        counterparty: "Internal Transfer",
        narration: "Cash deposited into bank.",
        lines: [
          {
            ledgerId: "ledger-hdfc",
            side: "debit",
            amount: 3000,
            note: "Bank debit.",
          },
          {
            ledgerId: "ledger-cash",
            side: "credit",
            amount: 3000,
            note: "Cash credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const bankLedger = reports.item.bankBook.items.find((item) => item.ledgerId === "ledger-hdfc")
      const cashLedger = reports.item.bankBook.items.find((item) => item.ledgerId === "ledger-cash")

      assert.ok(bankLedger)
      assert.equal(bankLedger.entries.some((item) => item.voucherNumber === "CNT-2026-920"), true)
      assert.equal(bankLedger.debitTotal >= 3000, true)
      assert.equal(cashLedger, undefined)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service builds cash book from cash ledgers only", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-cash-book-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "CNT-2026-921",
        status: "posted",
        type: "contra",
        date: "2026-04-19",
        counterparty: "Internal Transfer",
        narration: "Cash withdrawn from bank.",
        lines: [
          {
            ledgerId: "ledger-cash",
            side: "debit",
            amount: 2500,
            note: "Cash debit.",
          },
          {
            ledgerId: "ledger-hdfc",
            side: "credit",
            amount: 2500,
            note: "Bank credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const cashLedger = reports.item.cashBook.items.find((item) => item.ledgerId === "ledger-cash")
      const bankLedger = reports.item.cashBook.items.find((item) => item.ledgerId === "ledger-hdfc")

      assert.ok(cashLedger)
      assert.equal(cashLedger.entries.some((item) => item.voucherNumber === "CNT-2026-921"), true)
      assert.equal(cashLedger.debitTotal >= 2500, true)
      assert.equal(bankLedger, undefined)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service exposes bank reconciliation workflow from bank book movement", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-bank-reconciliation-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const baselineReports = await getBillingAccountingReports(runtime.primary, adminUser)

      const receiptVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "RCPT-2026-922",
        status: "posted",
        type: "receipt",
        date: "2026-04-20",
        counterparty: "Recon Customer",
        narration: "Receipt entering bank pending reconciliation.",
        lines: [
          {
            ledgerId: "ledger-hdfc",
            side: "debit",
            amount: 4200,
            note: "Bank receipt.",
          },
          {
            ledgerId: "ledger-sundry-debtors",
            side: "credit",
            amount: 4200,
            note: "Customer settled.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const paymentVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PAY-2026-923",
        status: "posted",
        type: "payment",
        date: "2026-04-20",
        counterparty: "Recon Supplier",
        narration: "Payment with statement mismatch.",
        lines: [
          {
            ledgerId: "ledger-sundry-creditors",
            side: "debit",
            amount: 2100,
            note: "Supplier settlement.",
          },
          {
            ledgerId: "ledger-hdfc",
            side: "credit",
            amount: 2100,
            note: "Bank payment.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await reconcileBillingVoucher(runtime.primary, adminUser, config, receiptVoucher.item.id, {
        status: "matched",
        clearedDate: "2026-04-21",
        statementReference: "HDFC-MATCH-001",
        statementAmount: 4200,
        note: "Matched cleanly.",
      })

      await reconcileBillingVoucher(runtime.primary, adminUser, config, paymentVoucher.item.id, {
        status: "mismatch",
        clearedDate: "2026-04-21",
        statementReference: "HDFC-MISMATCH-001",
        statementAmount: 2050,
        note: "Statement differs by charge.",
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const bankLedger = reports.item.bankReconciliation.ledgers.find(
        (item) => item.ledgerId === "ledger-hdfc"
      )

      assert.ok(bankLedger)
      assert.equal(reports.item.bankReconciliation.matchedEntryCount, 1)
      assert.equal(reports.item.bankReconciliation.matchedDebitTotal, 4200)
      assert.equal(reports.item.bankReconciliation.matchedCreditTotal, 0)
      assert.equal(
        reports.item.bankReconciliation.pendingEntryCount,
        baselineReports.item.bankReconciliation.pendingEntryCount
      )
      assert.equal(reports.item.bankReconciliation.oldestPendingDays >= 0, true)
      assert.equal(reports.item.bankReconciliation.mismatchEntryCount, 1)
      assert.equal(reports.item.bankReconciliation.mismatchAmountTotal, 50)
      assert.equal(
        bankLedger.matchedEntries.some((item) => item.voucherNumber === "RCPT-2026-922"),
        true
      )
      assert.equal(bankLedger.matchedEntryCount >= 1, true)
      assert.equal(bankLedger.oldestPendingDays >= 0, true)
      assert.equal(
        bankLedger.pendingEntries.some((item) => item.voucherNumber === "RCPT-2026-922"),
        false
      )
      assert.equal(
        bankLedger.mismatchedEntries.some((item) => item.voucherNumber === "PAY-2026-923"),
        true
      )
      const mismatchEntry = bankLedger.mismatchedEntries.find(
        (item) => item.voucherNumber === "PAY-2026-923"
      )
      assert.equal(mismatchEntry?.statementReference, "HDFC-MISMATCH-001")
      assert.equal(mismatchEntry?.mismatchAmount, 50)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service builds customer statements from posted receivable activity", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-customer-statement-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const salesVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-910",
        status: "posted",
        type: "sales",
        date: "2026-04-10",
        counterparty: "Customer Statement Party",
        narration: "Sales invoice for customer statement.",
        lines: [
          {
            ledgerId: "ledger-sundry-debtors",
            side: "debit",
            amount: 5000,
            note: "Customer invoice debit.",
          },
          {
            ledgerId: "ledger-sales",
            side: "credit",
            amount: 5000,
            note: "Sales credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "CRN-2026-910",
        status: "posted",
        type: "credit_note",
        sourceVoucherId: salesVoucher.item.id,
        date: "2026-04-11",
        counterparty: "Customer Statement Party",
        narration: "Credit note against the sales invoice.",
        lines: [
          {
            ledgerId: "ledger-sales",
            side: "debit",
            amount: 500,
            note: "Revenue correction.",
          },
          {
            ledgerId: "ledger-sundry-debtors",
            side: "credit",
            amount: 500,
            note: "Receivable reduction.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "RCPT-2026-910",
        status: "posted",
        type: "receipt",
        date: "2026-04-12",
        counterparty: "Customer Statement Party",
        narration: "Receipt adjusted against the sales invoice.",
        lines: [
          {
            ledgerId: "ledger-hdfc",
            side: "debit",
            amount: 2000,
            note: "Bank receipt.",
          },
          {
            ledgerId: "ledger-sundry-debtors",
            side: "credit",
            amount: 2000,
            note: "Customer settlement.",
          },
        ],
        billAllocations: [
          {
            referenceType: "against_ref",
            referenceNumber: "SAL-2026-910",
            referenceDate: "2026-04-10",
            dueDate: "2026-04-30",
            amount: 2000,
            note: "Receipt allocation.",
          },
        ],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const customerStatement = reports.item.customerStatement.items.find(
        (item) => item.customerName === "Customer Statement Party"
      )

      assert.ok(customerStatement)
      assert.equal(customerStatement.entries.length, 3)
      assert.equal(customerStatement.debitTotal, 5000)
      assert.equal(customerStatement.creditTotal, 2500)
      assert.equal(customerStatement.closingSide, "debit")
      assert.equal(customerStatement.closingAmount, 2500)
      assert.deepEqual(
        customerStatement.entries.map((entry) => entry.voucherNumber),
        ["SAL-2026-910", "CRN-2026-910", "RCPT-2026-910"]
      )
      assert.equal(customerStatement.entries[0]?.runningAmount, 5000)
      assert.equal(customerStatement.entries[1]?.referenceVoucherNumber, "SAL-2026-910")
      assert.equal(customerStatement.entries[1]?.runningAmount, 4500)
      assert.equal(customerStatement.entries[2]?.referenceVoucherNumber, "SAL-2026-910")
      assert.equal(customerStatement.entries[2]?.runningAmount, 2500)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service builds supplier statements from posted payable activity", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-supplier-statement-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const purchaseVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PUR-2026-910",
        status: "posted",
        type: "purchase",
        date: "2026-04-10",
        counterparty: "Supplier Statement Party",
        narration: "Purchase bill for supplier statement.",
        lines: [
          {
            ledgerId: "ledger-purchase",
            side: "debit",
            amount: 5000,
            note: "Purchase debit.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 5000,
            note: "Supplier credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "DBN-2026-910",
        status: "posted",
        type: "debit_note",
        sourceVoucherId: purchaseVoucher.item.id,
        date: "2026-04-11",
        counterparty: "Supplier Statement Party",
        narration: "Debit note against the purchase bill.",
        lines: [
          {
            ledgerId: "ledger-sundry-creditors",
            side: "debit",
            amount: 500,
            note: "Payable reduction.",
          },
          {
            ledgerId: "ledger-purchase",
            side: "credit",
            amount: 500,
            note: "Purchase correction.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PAY-2026-910",
        status: "posted",
        type: "payment",
        date: "2026-04-12",
        counterparty: "Supplier Statement Party",
        narration: "Payment adjusted against the purchase bill.",
        lines: [
          {
            ledgerId: "ledger-sundry-creditors",
            side: "debit",
            amount: 2000,
            note: "Supplier settlement.",
          },
          {
            ledgerId: "ledger-hdfc",
            side: "credit",
            amount: 2000,
            note: "Bank payment.",
          },
        ],
        billAllocations: [
          {
            referenceType: "against_ref",
            referenceNumber: "PUR-2026-910",
            referenceDate: "2026-04-10",
            dueDate: "2026-04-30",
            amount: 2000,
            note: "Payment allocation.",
          },
        ],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const supplierStatement = reports.item.supplierStatement.items.find(
        (item) => item.supplierName === "Supplier Statement Party"
      )

      assert.ok(supplierStatement)
      assert.equal(supplierStatement.entries.length, 3)
      assert.equal(supplierStatement.debitTotal, 2500)
      assert.equal(supplierStatement.creditTotal, 5000)
      assert.equal(supplierStatement.closingSide, "credit")
      assert.equal(supplierStatement.closingAmount, 2500)
      assert.deepEqual(
        supplierStatement.entries.map((entry) => entry.voucherNumber),
        ["PUR-2026-910", "DBN-2026-910", "PAY-2026-910"]
      )
      assert.equal(supplierStatement.entries[0]?.runningAmount, 5000)
      assert.equal(supplierStatement.entries[0]?.runningSide, "credit")
      assert.equal(supplierStatement.entries[1]?.referenceVoucherNumber, "PUR-2026-910")
      assert.equal(supplierStatement.entries[1]?.runningAmount, 4500)
      assert.equal(supplierStatement.entries[2]?.referenceVoucherNumber, "PUR-2026-910")
      assert.equal(supplierStatement.entries[2]?.runningAmount, 2500)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service derives aging follow-up exceptions and party settlement summaries", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-settlement-controls-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-950",
        status: "posted",
        type: "sales",
        date: "2026-03-01",
        counterparty: "B5 Customer",
        narration: "Old receivable for aging.",
        lines: [
          {
            ledgerId: "ledger-sundry-debtors",
            side: "debit",
            amount: 5000,
            note: "Customer invoice.",
          },
          {
            ledgerId: "ledger-sales",
            side: "credit",
            amount: 5000,
            note: "Sales credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        sales: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PUR-2026-950",
        status: "posted",
        type: "purchase",
        date: "2026-02-20",
        counterparty: "B5 Supplier",
        narration: "Old payable for aging.",
        lines: [
          {
            ledgerId: "ledger-purchase",
            side: "debit",
            amount: 4000,
            note: "Purchase debit.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 4000,
            note: "Supplier credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "RCPT-2026-950",
        status: "posted",
        type: "receipt",
        date: "2026-05-20",
        counterparty: "B5 Customer",
        narration: "Receipt with advance and over-settlement.",
        lines: [
          {
            ledgerId: "ledger-hdfc",
            side: "debit",
            amount: 6000,
            note: "Bank receipt.",
          },
          {
            ledgerId: "ledger-sundry-debtors",
            side: "credit",
            amount: 6000,
            note: "Customer settlement.",
          },
        ],
        billAllocations: [
          {
            referenceType: "against_ref",
            referenceNumber: "SAL-2026-950",
            referenceDate: "2026-03-01",
            dueDate: "2026-03-15",
            amount: 5500,
            note: "Over-collected against bill.",
          },
          {
            referenceType: "on_account",
            referenceNumber: "B5-ON-ACCOUNT",
            referenceDate: null,
            dueDate: null,
            amount: 500,
            note: "Unmatched collection.",
          },
        ],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PAY-2026-950",
        status: "posted",
        type: "payment",
        date: "2026-05-18",
        counterparty: "B5 Supplier",
        narration: "Payment with advance allocation.",
        lines: [
          {
            ledgerId: "ledger-sundry-creditors",
            side: "debit",
            amount: 2000,
            note: "Supplier settlement.",
          },
          {
            ledgerId: "ledger-hdfc",
            side: "credit",
            amount: 2000,
            note: "Bank payment.",
          },
        ],
        billAllocations: [
          {
            referenceType: "new_ref",
            referenceNumber: "ADV-B5-001",
            referenceDate: null,
            dueDate: null,
            amount: 2000,
            note: "Advance payment.",
          },
        ],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const payableAgingItem = reports.item.payableAging.items.find(
        (item) => item.voucherNumber === "PUR-2026-950"
      )

      assert.equal(reports.item.outstanding.asOfDate, "2026-05-20")
      assert.equal(
        reports.item.receivableAging.items.some((item) => item.voucherNumber === "SAL-2026-950"),
        false
      )
      assert.ok(payableAgingItem)
      assert.equal(payableAgingItem.outstandingAmount, 4000)
      assert.equal(payableAgingItem.bucketKey, "61_90")
      assert.equal(
        reports.item.settlementFollowUp.items.some(
          (item) => item.voucherNumber === "PUR-2026-950" && item.priority === "high"
        ),
        true
      )
      assert.equal(reports.item.settlementExceptions.advanceTotal, 2000)
      assert.equal(reports.item.settlementExceptions.onAccountTotal, 500)
      assert.equal(reports.item.settlementExceptions.overpaymentTotal, 500)
      assert.equal(
        reports.item.settlementExceptions.items.some(
          (item) => item.category === "overpayment" && item.referenceVoucherNumber === "SAL-2026-950"
        ),
        true
      )

      const customerSummary = reports.item.partySettlementSummary.items.find(
        (item) => item.counterparty === "B5 Customer"
      )
      const supplierSummary = reports.item.partySettlementSummary.items.find(
        (item) => item.counterparty === "B5 Supplier"
      )

      assert.ok(customerSummary)
      assert.ok(supplierSummary)
      assert.equal(customerSummary.receiptAmount, 6000)
      assert.equal(customerSummary.unallocatedReceiptAmount, 0)
      assert.equal(supplierSummary.paymentAmount, 2000)
      assert.equal(supplierSummary.unallocatedPaymentAmount, 0)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
