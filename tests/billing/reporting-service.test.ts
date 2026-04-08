import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { billingTableNames } from "../../apps/billing/database/table-names.js"
import { executeBillingOpeningBalanceRollover } from "../../apps/billing/src/services/opening-balance-rollover-service.js"
import { getBillingAccountingReports } from "../../apps/billing/src/services/reporting-service.js"
import { executeBillingYearEndAdjustmentControl } from "../../apps/billing/src/services/year-end-control-service.js"
import { executeBillingYearCloseWorkflow } from "../../apps/billing/src/services/year-close-service.js"
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

const financeManagerUser = {
  ...adminUser,
  id: "auth-user:billing-finance-manager",
  actorType: "staff" as const,
  isSuperAdmin: false,
  roles: [
    {
      key: "billing_finance_manager",
      name: "Finance Manager",
      summary: "Approves high-risk finance actions.",
      actorType: "staff" as const,
      isActive: true,
      permissions: [],
    },
  ],
  permissions: [
    {
      key: "billing:vouchers:approve",
      name: "Billing Voucher Approval",
      summary: "Approve or reject billing vouchers.",
      scopeType: "module" as const,
      appId: "billing",
      resourceKey: "billing-review",
      actionKey: "approve",
      route: "/dashboard/billing/voucher-register",
      isActive: true,
    },
  ],
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

test("billing reporting service reads settlement controls from bill-engine and allocation split tables", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-settlement-cutover-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-CUTOVER",
        status: "posted",
        type: "sales",
        date: "2026-03-01",
        counterparty: "Cutover Customer",
        narration: "Sales bill for split-table report cutover.",
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
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PUR-2026-CUTOVER",
        status: "posted",
        type: "purchase",
        date: "2026-02-20",
        counterparty: "Cutover Supplier",
        narration: "Purchase bill for split-table report cutover.",
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
        voucherNumber: "RCPT-2026-CUTOVER",
        status: "posted",
        type: "receipt",
        date: "2026-05-20",
        counterparty: "Cutover Customer",
        narration: "Receipt cutover source rows.",
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
            referenceNumber: "SAL-2026-CUTOVER",
            referenceDate: "2026-03-01",
            dueDate: "2026-03-15",
            amount: 5500,
            note: "Original against-ref settlement.",
          },
          {
            referenceType: "on_account",
            referenceNumber: "CUTOVER-ON-ACCOUNT",
            referenceDate: null,
            dueDate: null,
            amount: 500,
            note: "Original on-account receipt.",
          },
        ],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PAY-2026-CUTOVER",
        status: "posted",
        type: "payment",
        date: "2026-05-18",
        counterparty: "Cutover Supplier",
        narration: "Payment cutover source rows.",
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
            referenceNumber: "CUTOVER-ADV-001",
            referenceDate: null,
            dueDate: null,
            amount: 2000,
            note: "Original advance payment.",
          },
        ],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await runtime.primary
        .updateTable(billingTableNames.billReferences)
        .set({
          due_date: "2026-05-08",
          settled_amount: 4500,
          balance_amount: 500,
        })
        .where("ref_number", "=", "SAL-2026-CUTOVER")
        .execute()

      await runtime.primary
        .updateTable(billingTableNames.billOverdueTracking)
        .set({
          overdue_days: 12,
          overdue_amount: 500,
          bucket_key: "1_30",
          bucket_label: "1-30 Days",
        })
        .where("ref_number", "=", "SAL-2026-CUTOVER")
        .execute()

      await runtime.primary
        .updateTable(billingTableNames.billReferences)
        .set({
          original_amount: 700,
          balance_amount: 700,
        })
        .where("ref_number", "=", "CUTOVER-ON-ACCOUNT")
        .execute()

      await runtime.primary
        .updateTable(billingTableNames.billReferences)
        .set({
          original_amount: 2300,
          balance_amount: 2300,
        })
        .where("ref_number", "=", "CUTOVER-ADV-001")
        .execute()

      await runtime.primary
        .updateTable(billingTableNames.receiptItemVouchers)
        .set({ allocated_amount: 3000 })
        .where("reference_number", "=", "SAL-2026-CUTOVER")
        .execute()

      await runtime.primary
        .updateTable(billingTableNames.receiptItemVouchers)
        .set({ allocated_amount: 700 })
        .where("reference_number", "=", "CUTOVER-ON-ACCOUNT")
        .execute()

      await runtime.primary
        .updateTable(billingTableNames.paymentItemVouchers)
        .set({ allocated_amount: 1500 })
        .where("reference_number", "=", "CUTOVER-ADV-001")
        .execute()

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const receivableItem = reports.item.receivableAging.items.find(
        (item) => item.voucherNumber === "SAL-2026-CUTOVER"
      )
      const customerSummary = reports.item.partySettlementSummary.items.find(
        (item) => item.counterparty === "Cutover Customer"
      )
      const supplierSummary = reports.item.partySettlementSummary.items.find(
        (item) => item.counterparty === "Cutover Supplier"
      )

      assert.ok(receivableItem)
      assert.equal(receivableItem.outstandingAmount, 500)
      assert.equal(receivableItem.overdueDays, 12)
      assert.equal(reports.item.settlementExceptions.advanceTotal, 2300)
      assert.equal(reports.item.settlementExceptions.onAccountTotal, 700)
      assert.ok(customerSummary)
      assert.ok(supplierSummary)
      assert.equal(customerSummary.allocatedReceiptAmount, 3700)
      assert.equal(customerSummary.unallocatedReceiptAmount, 2300)
      assert.equal(supplierSummary.allocatedPaymentAmount, 1500)
      assert.equal(supplierSummary.unallocatedPaymentAmount, 500)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service builds GST sales register from posted sales invoices and credit notes", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-gst-sales-register-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const salesVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-960",
        status: "posted",
        type: "sales",
        date: "2026-04-22",
        counterparty: "GST Register Customer",
        narration: "GST outward invoice.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "6204",
          taxableAmount: 10000,
          taxRate: 18,
          taxableLedgerId: "ledger-sales",
          partyLedgerId: "ledger-sundry-debtors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "CRN-2026-960",
        status: "posted",
        type: "credit_note",
        sourceVoucherId: salesVoucher.item.id,
        date: "2026-04-23",
        counterparty: "GST Register Customer",
        narration: "GST credit note.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "6204",
          taxableAmount: 2000,
          taxRate: 18,
          taxableLedgerId: "ledger-sales",
          partyLedgerId: "ledger-sundry-debtors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const invoiceRow = reports.item.gstSalesRegister.items.find(
        (item) => item.voucherNumber === "SAL-2026-960"
      )
      const creditNoteRow = reports.item.gstSalesRegister.items.find(
        (item) => item.voucherNumber === "CRN-2026-960"
      )

      assert.ok(invoiceRow)
      assert.ok(creditNoteRow)
      assert.equal(reports.item.gstSalesRegister.invoiceCount >= 1, true)
      assert.equal(reports.item.gstSalesRegister.creditNoteCount, 1)
      assert.equal(invoiceRow.taxableAmount, 10000)
      assert.equal(invoiceRow.totalTaxAmount, 1800)
      assert.equal(creditNoteRow.taxableAmount, -2000)
      assert.equal(creditNoteRow.totalTaxAmount, -360)
      assert.equal(creditNoteRow.referenceVoucherNumber, "SAL-2026-960")
      assert.equal(reports.item.gstSalesRegister.taxableAmountTotal >= 8000, true)
      assert.equal(reports.item.gstSalesRegister.totalTaxAmountTotal >= 1440, true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service reads GST registers from split sales and purchase tables", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-gst-cutover-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const salesVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-GSTCUT",
        status: "posted",
        type: "sales",
        date: "2026-04-22",
        counterparty: "GST Cutover Customer",
        narration: "GST sales cutover source voucher.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "6204",
          taxableAmount: 10000,
          taxRate: 18,
          taxableLedgerId: "ledger-sales",
          partyLedgerId: "ledger-sundry-debtors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const purchaseVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PUR-2026-GSTCUT",
        status: "posted",
        type: "purchase",
        date: "2026-04-22",
        counterparty: "GST Cutover Supplier",
        narration: "GST purchase cutover source voucher.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "5208",
          taxableAmount: 12000,
          taxRate: 12,
          taxableLedgerId: "ledger-purchase",
          partyLedgerId: "ledger-sundry-creditors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await runtime.primary
        .updateTable(billingTableNames.salesVouchers)
        .set({
          taxable_amount: 11000,
          tax_amount: 3080,
          net_amount: 14080,
          place_of_supply: "MH",
        })
        .where("voucher_id", "=", salesVoucher.item.id)
        .execute()

      await runtime.primary
        .updateTable(billingTableNames.salesItemVouchers)
        .set({
          hsn_or_sac: "9999",
          tax_rate: 28,
          taxable_amount: 11000,
          cgst_amount: 1540,
          sgst_amount: 1540,
          igst_amount: 0,
          total_tax_amount: 3080,
          place_of_supply: "MH",
        })
        .where("voucher_id", "=", salesVoucher.item.id)
        .execute()

      await runtime.primary
        .updateTable(billingTableNames.purchaseVouchers)
        .set({
          taxable_amount: 9000,
          tax_amount: 450,
          net_amount: 9450,
          place_of_supply: "TN",
        })
        .where("voucher_id", "=", purchaseVoucher.item.id)
        .execute()

      await runtime.primary
        .updateTable(billingTableNames.purchaseItemVouchers)
        .set({
          hsn_or_sac: "7777",
          tax_rate: 5,
          taxable_amount: 9000,
          cgst_amount: 225,
          sgst_amount: 225,
          igst_amount: 0,
          total_tax_amount: 450,
          place_of_supply: "TN",
        })
        .where("voucher_id", "=", purchaseVoucher.item.id)
        .execute()

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const salesRow = reports.item.gstSalesRegister.items.find(
        (item) => item.voucherNumber === "SAL-2026-GSTCUT"
      )
      const purchaseRow = reports.item.gstPurchaseRegister.items.find(
        (item) => item.voucherNumber === "PUR-2026-GSTCUT"
      )

      assert.ok(salesRow)
      assert.ok(purchaseRow)
      assert.equal(salesRow.hsnOrSac, "9999")
      assert.equal(salesRow.taxRate, 28)
      assert.equal(salesRow.taxableAmount, 11000)
      assert.equal(salesRow.totalTaxAmount, 3080)
      assert.equal(salesRow.invoiceAmount, 14080)
      assert.equal(salesRow.placeOfSupply, "MH")
      assert.equal(purchaseRow.hsnOrSac, "7777")
      assert.equal(purchaseRow.taxRate, 5)
      assert.equal(purchaseRow.taxableAmount, 9000)
      assert.equal(purchaseRow.totalTaxAmount, 450)
      assert.equal(purchaseRow.invoiceAmount, 9450)
      assert.equal(purchaseRow.placeOfSupply, "TN")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service builds GST purchase register from posted purchase invoices and debit notes", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-gst-purchase-register-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const purchaseVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PUR-2026-960",
        status: "posted",
        type: "purchase",
        date: "2026-04-22",
        counterparty: "GST Register Supplier",
        narration: "GST inward invoice.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "5208",
          taxableAmount: 12000,
          taxRate: 12,
          taxableLedgerId: "ledger-purchase",
          partyLedgerId: "ledger-sundry-creditors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "DBN-2026-960",
        status: "posted",
        type: "debit_note",
        sourceVoucherId: purchaseVoucher.item.id,
        date: "2026-04-23",
        counterparty: "GST Register Supplier",
        narration: "GST debit note.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "5208",
          taxableAmount: 3000,
          taxRate: 12,
          taxableLedgerId: "ledger-purchase",
          partyLedgerId: "ledger-sundry-creditors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const invoiceRow = reports.item.gstPurchaseRegister.items.find(
        (item) => item.voucherNumber === "PUR-2026-960"
      )
      const debitNoteRow = reports.item.gstPurchaseRegister.items.find(
        (item) => item.voucherNumber === "DBN-2026-960"
      )

      assert.ok(invoiceRow)
      assert.ok(debitNoteRow)
      assert.equal(reports.item.gstPurchaseRegister.invoiceCount >= 1, true)
      assert.equal(reports.item.gstPurchaseRegister.debitNoteCount, 1)
      assert.equal(invoiceRow.taxableAmount, 12000)
      assert.equal(invoiceRow.totalTaxAmount, 1440)
      assert.equal(debitNoteRow.taxableAmount, -3000)
      assert.equal(debitNoteRow.totalTaxAmount, -360)
      assert.equal(debitNoteRow.referenceVoucherNumber, "PUR-2026-960")
      assert.equal(reports.item.gstPurchaseRegister.taxableAmountTotal >= 9000, true)
      assert.equal(reports.item.gstPurchaseRegister.totalTaxAmountTotal >= 1080, true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service builds input versus output GST summary from posted books", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-gst-tax-summary-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-970",
        status: "posted",
        type: "sales",
        date: "2026-04-24",
        counterparty: "Tax Summary Customer",
        narration: "Output GST invoice.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "6204",
          taxableAmount: 10000,
          taxRate: 18,
          taxableLedgerId: "ledger-sales",
          partyLedgerId: "ledger-sundry-debtors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PUR-2026-970",
        status: "posted",
        type: "purchase",
        date: "2026-04-24",
        counterparty: "Tax Summary Supplier",
        narration: "Input GST invoice.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "5208",
          taxableAmount: 4000,
          taxRate: 12,
          taxableLedgerId: "ledger-purchase",
          partyLedgerId: "ledger-sundry-creditors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const summary = reports.item.inputOutputTaxSummary

      assert.equal(summary.outputCgst >= 900, true)
      assert.equal(summary.outputSgst >= 900, true)
      assert.equal(summary.inputCgst >= 240, true)
      assert.equal(summary.inputSgst >= 240, true)
      assert.equal(summary.netCgstPayable >= 660, true)
      assert.equal(summary.netSgstPayable >= 660, true)
      assert.equal(summary.netTaxPayable >= 1320, true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service builds filing-ready GST period summaries", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-gst-filing-summary-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-980",
        status: "posted",
        type: "sales",
        date: "2026-04-10",
        counterparty: "Period One Customer",
        narration: "April output invoice.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "6204",
          taxableAmount: 10000,
          taxRate: 18,
          taxableLedgerId: "ledger-sales",
          partyLedgerId: "ledger-sundry-debtors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PUR-2026-980",
        status: "posted",
        type: "purchase",
        date: "2026-04-12",
        counterparty: "Period One Supplier",
        narration: "April input invoice.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "5208",
          taxableAmount: 5000,
          taxRate: 12,
          taxableLedgerId: "ledger-purchase",
          partyLedgerId: "ledger-sundry-creditors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-981",
        status: "posted",
        type: "sales",
        date: "2026-05-05",
        counterparty: "Period Two Customer",
        narration: "May output invoice.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "inter",
          placeOfSupply: "TN",
          partyGstin: "33ABCDE1234F1Z5",
          hsnOrSac: "6204",
          taxableAmount: 8000,
          taxRate: 18,
          taxableLedgerId: "ledger-sales",
          partyLedgerId: "ledger-sundry-debtors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)
      const april = reports.item.gstFilingSummary.periods.find(
        (period) => period.periodKey === "2026-04"
      )
      const may = reports.item.gstFilingSummary.periods.find(
        (period) => period.periodKey === "2026-05"
      )

      assert.equal(reports.item.gstFilingSummary.latestPeriodKey, "2026-05")
      assert.ok(april)
      assert.ok(may)
      assert.equal(april.salesInvoiceCount, 1)
      assert.equal(april.purchaseInvoiceCount, 1)
      assert.equal(april.outputTaxTotal, 1800)
      assert.equal(april.inputTaxTotal, 600)
      assert.equal(april.netTaxPayable, 1200)
      assert.equal(may.salesInvoiceCount, 1)
      assert.equal(may.purchaseInvoiceCount, 0)
      assert.equal(may.outputTaxTotal, 1440)
      assert.equal(may.inputTaxTotal, 0)
      assert.equal(may.netTaxPayable, 1440)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service includes return documents in statements and GST registers", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-return-reports-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SRT-2026-701",
        status: "posted",
        type: "sales_return",
        sourceVoucherId: "voucher-sales-001",
        date: "2026-04-20",
        counterparty: "Maya Fashion House",
        narration: "Customer returned damaged units.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "6204",
          taxableAmount: 2000,
          taxRate: 5,
          taxableLedgerId: "ledger-sales",
          partyLedgerId: "ledger-sundry-debtors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PRT-2026-702",
        status: "posted",
        type: "purchase_return",
        sourceVoucherId: "voucher-purchase-001",
        date: "2026-04-21",
        counterparty: "Northwind Textiles LLP",
        narration: "Supplier return for rejected fabric.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "inter",
          placeOfSupply: "TN",
          partyGstin: "33AAACS4321P1Z1",
          hsnOrSac: "6205",
          taxableAmount: 3000,
          taxRate: 12,
          taxableLedgerId: "ledger-purchase",
          partyLedgerId: "ledger-sundry-creditors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser)

      assert.equal(
        reports.item.customerStatement.items.some((item) =>
          item.entries.some((entry) => entry.voucherType === "sales_return")
        ),
        true
      )
      assert.equal(
        reports.item.supplierStatement.items.some((item) =>
          item.entries.some((entry) => entry.voucherType === "purchase_return")
        ),
        true
      )
      assert.equal(
        reports.item.gstSalesRegister.items.some((item) => item.voucherType === "sales_return"),
        true
      )
      assert.equal(
        reports.item.gstPurchaseRegister.items.some((item) => item.voucherType === "purchase_return"),
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service exposes inventory authority, valuation policy, stock rules, and warehouse positions", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-stock-reporting-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.billing.compliance.stock.valuationMethod = "weighted_average"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const reports = await getBillingAccountingReports(runtime.primary, adminUser, config)

      assert.equal(reports.item.inventoryAuthority.masterOwner, "core")
      assert.equal(reports.item.inventoryAuthority.transactionOwner, "billing")
      assert.equal(reports.item.stockValuationPolicy.method, "weighted_average")
      assert.ok(reports.item.stockAccountingRules.items.length >= 3)
      assert.ok(reports.item.stockLedger.items.length >= 1)
      assert.ok(reports.item.warehouseStockPosition.items.length >= 1)
      assert.equal(
        reports.item.warehouseStockPosition.items.some((item) => item.inventoryValue > 0),
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service includes stock valuation after landed cost and stock adjustment", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-stock-valuation-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.billing.compliance.stock.valuationMethod = "moving_average"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "STA-2026-001",
        status: "posted",
        type: "stock_adjustment",
        date: "2026-04-21",
        counterparty: "Physical Count",
        narration: "Positive physical adjustment.",
        lines: [
          {
            ledgerId: "ledger-purchase",
            side: "debit",
            amount: 300,
            note: "Inventory correction",
          },
          {
            ledgerId: "ledger-rent",
            side: "credit",
            amount: 300,
            note: "Offset account",
          },
        ],
        billAllocations: [],
        gst: null,
        sales: null,
        stock: {
          items: [
            {
              productId: "core-product:aster-linen-shirt",
              warehouseId: "warehouse:default",
              quantity: 3,
              unit: "Nos",
              unitCost: 100,
              landedCostAmount: 0,
              note: "Count gain",
            },
          ],
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "LCT-2026-001",
        status: "posted",
        type: "landed_cost",
        sourceVoucherId: "voucher-purchase-001",
        date: "2026-04-22",
        counterparty: "Inbound Freight",
        narration: "Freight capitalized into stock.",
        lines: [
          {
            ledgerId: "ledger-purchase",
            side: "debit",
            amount: 150,
            note: "Inventory capitalization",
          },
          {
            ledgerId: "ledger-freight",
            side: "credit",
            amount: 150,
            note: "Freight absorbed",
          },
        ],
        billAllocations: [],
        gst: null,
        sales: null,
        stock: {
          items: [
            {
              productId: "core-product:aster-linen-shirt",
              warehouseId: "warehouse:default",
              quantity: 0,
              unit: "Nos",
              unitCost: 0,
              landedCostAmount: 150,
              note: "Freight allocation",
            },
          ],
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser, config)

      assert.equal(reports.item.stockValuationReport.valuationMethod, "moving_average")
      assert.equal(
        reports.item.stockAccountingRules.items.some((item) => item.ruleKey === "stock_adjustment"),
        true
      )
      assert.equal(
        reports.item.stockAccountingRules.items.some((item) => item.ruleKey === "landed_cost"),
        true
      )
      assert.equal(
        reports.item.stockValuationReport.items.some(
          (item) =>
            item.productId === "core-product:aster-linen-shirt" &&
            item.inventoryValue > 0
        ),
        true
      )
      assert.equal(
        reports.item.stockLedger.items.some((item) => item.movementType === "billing_landed_cost"),
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service exposes accounting exceptions and finance dashboard KPIs", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-controls-report-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.billing.compliance.review.enabled = true
    config.billing.compliance.review.amountThreshold = 20000

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const created = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PAY-2026-980",
        status: "posted",
        type: "payment",
        sourceVoucherId: null,
        dimensions: {
          branch: "Chennai Branch",
          project: "Recovery Drive",
          costCenter: "Treasury",
        },
        date: "2026-04-01",
        counterparty: "Control Vendor",
        narration: "Back-dated sensitive payment for control reporting.",
        lines: [
          {
            ledgerId: "ledger-sundry-creditors",
            side: "debit",
            amount: 35000,
            note: "Supplier settlement",
          },
          {
            ledgerId: "ledger-hdfc",
            side: "credit",
            amount: 35000,
            note: "Bank payout",
          },
        ],
        gst: null,
        billAllocations: [],
        transport: null,
        sales: null,
        stock: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await reverseBillingVoucher(runtime.primary, adminUser, config, created.item.id, {
        reason: "Control reversal for reporting.",
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser, config)

      assert.equal(reports.item.financeDashboard.pendingReviewCount >= 1, true)
      assert.equal(reports.item.financeDashboard.backDatedVoucherCount >= 1, true)
      assert.equal(reports.item.financeDashboard.bankPendingEntryCount >= 1, true)
      assert.equal(reports.item.exceptions.reversedCount >= 1, true)
      assert.equal(reports.item.exceptions.backDatedCount >= 1, true)
      assert.equal(
        reports.item.exceptions.items.some(
          (item) =>
            item.voucherId === created.item.id &&
            item.dimensions.branch === "Chennai Branch"
        ),
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service exposes a month-end checklist from finance controls", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-month-end-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.billing.compliance.review.enabled = true
    config.billing.compliance.review.amountThreshold = 15000

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PAY-2026-981",
        status: "posted",
        type: "payment",
        sourceVoucherId: null,
        dimensions: {
          branch: "HQ",
          project: "Month Close",
          costCenter: "Finance",
        },
        date: "2026-04-01",
        counterparty: "Checklist Vendor",
        narration: "Sensitive voucher for month-end checklist.",
        lines: [
          {
            ledgerId: "ledger-sundry-creditors",
            side: "debit",
            amount: 22000,
            note: "Supplier settlement",
          },
          {
            ledgerId: "ledger-hdfc",
            side: "credit",
            amount: 22000,
            note: "Bank payout",
          },
        ],
        gst: null,
        billAllocations: [],
        transport: null,
        sales: null,
        stock: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser, config)

      assert.equal(reports.item.monthEndChecklist.items.length >= 5, true)
      assert.equal(reports.item.monthEndChecklist.blockedCount >= 1, true)
      assert.equal(reports.item.financialYearCloseWorkflow?.financialYearCode, "FY2026-27")
      assert.equal(reports.item.openingBalanceRolloverPolicy, null)
      assert.equal(
        reports.item.monthEndChecklist.items.some((item) => item.id === "reviews"),
        true
      )
      assert.equal(
        reports.item.monthEndChecklist.items.some(
          (item) => item.id === "bank-reconciliation" && item.status !== "ready"
        ),
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service exposes the latest opening-balance rollover policy", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-rollover-reporting-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await executeBillingYearCloseWorkflow(runtime.primary, financeManagerUser, config, {
        action: "close",
        financialYearCode: "FY2025-26",
        note: "Close before rollover report test.",
      })

      await executeBillingOpeningBalanceRollover(runtime.primary, financeManagerUser, {
        action: "preview",
        sourceFinancialYearCode: "FY2025-26",
        note: "Preview before reporting check.",
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser, config)

      assert.equal(reports.item.openingBalanceRolloverPolicy?.sourceFinancialYearCode, "FY2025-26")
      assert.equal(reports.item.openingBalanceRolloverPolicy?.targetFinancialYearCode, "FY2026-27")
      assert.equal(reports.item.openingBalanceRolloverPolicy?.status, "previewed")
      assert.equal(
        reports.item.openingBalanceRolloverPolicy?.items.some(
          (item) => item.policyTreatment === "carry_forward"
        ),
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing reporting service exposes the latest year-end adjustment control policy", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-year-end-reporting-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await executeBillingYearCloseWorkflow(runtime.primary, financeManagerUser, config, {
        action: "close",
        financialYearCode: "FY2025-26",
        note: "Close before year-end reporting test.",
      })

      await executeBillingOpeningBalanceRollover(runtime.primary, financeManagerUser, {
        action: "apply",
        sourceFinancialYearCode: "FY2025-26",
        note: "Apply rollover before year-end reporting test.",
      })

      await executeBillingYearEndAdjustmentControl(runtime.primary, financeManagerUser, {
        action: "preview",
        sourceFinancialYearCode: "FY2025-26",
        note: "Preview year-end control policy.",
      })

      const reports = await getBillingAccountingReports(runtime.primary, adminUser, config)

      assert.equal(reports.item.yearEndAdjustmentControlPolicy?.sourceFinancialYearCode, "FY2025-26")
      assert.equal(reports.item.yearEndAdjustmentControlPolicy?.targetFinancialYearCode, "FY2026-27")
      assert.equal(reports.item.yearEndAdjustmentControlPolicy?.status, "previewed")
      assert.equal(
        reports.item.yearEndAdjustmentControlPolicy?.items.some(
          (item) => item.controlKey === "adjustment-journals"
        ),
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
