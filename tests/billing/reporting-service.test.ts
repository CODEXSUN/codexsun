import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getBillingAccountingReports } from "../../apps/billing/src/services/reporting-service.js"
import {
  createBillingVoucher,
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

      assert.ok(salesLedger)
      assert.equal(salesLedger.creditAmount > 0, true)
      assert.equal(reports.item.profitAndLoss.totalIncome > 0, true)
      assert.ok(salesOutstanding)
      assert.equal(salesOutstanding.settledAmount, 98400)
      assert.equal(salesOutstanding.outstandingAmount, 36000)
      assert.equal(reports.item.outstanding.receivableTotal >= 36000, true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
