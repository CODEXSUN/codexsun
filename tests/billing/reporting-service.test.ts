import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getBillingAccountingReports } from "../../apps/billing/src/services/reporting-service.js"
import { replaceBillingLedgerEntries } from "../../apps/billing/src/services/ledger-entry-store.js"
import {
  createBillingVoucher,
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
