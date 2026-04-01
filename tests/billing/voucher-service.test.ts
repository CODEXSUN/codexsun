import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createBillingVoucher,
  deleteBillingVoucher,
  listBillingVouchers,
  updateBillingVoucher,
} from "../../apps/billing/src/services/voucher-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"
import { ApplicationError } from "../../apps/framework/src/runtime/errors/application-error.js"

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

test("billing voucher service posts balanced vouchers and supports update/delete CRUD", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-service-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const created = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "RCPT-2026-099",
        type: "receipt",
        date: "2026-04-01",
        counterparty: "Aarav Retail",
        narration: "Receipt posted against customer dues.",
        lines: [
          {
            ledgerId: "ledger-hdfc",
            side: "debit",
            amount: 18000,
            note: "Bank receipt.",
          },
          {
            ledgerId: "ledger-sundry-debtors",
            side: "credit",
            amount: 18000,
            note: "Receivable settled.",
          },
        ],
        billAllocations: [
          {
            referenceType: "against_ref",
            referenceNumber: "SAL-2026-001",
            referenceDate: "2026-03-24",
            dueDate: "2026-04-10",
            amount: 18000,
            note: "Part settlement",
          },
        ],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      assert.equal(created.item.type, "receipt")
      assert.equal(created.item.lines.length, 2)
      assert.equal(created.item.financialYear.code, "FY2026-27")
      assert.equal(created.item.billAllocations.length, 1)
      assert.equal(created.item.eInvoice.status, "not_applicable")

      const listedAfterCreate = await listBillingVouchers(runtime.primary, adminUser)
      assert.equal(listedAfterCreate.items.some((item) => item.id === created.item.id), true)
      const receiptOnly = await listBillingVouchers(runtime.primary, adminUser, "receipt")
      assert.equal(
        receiptOnly.items.every((item) => item.type === "receipt"),
        true
      )

      const updated = await updateBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        created.item.id,
        {
          voucherNumber: "RCPT-2026-099",
          type: "receipt",
          date: "2026-04-01",
          counterparty: "Aarav Retail LLP",
          narration: "Receipt updated after bank confirmation.",
          lines: [
            {
              ledgerId: "ledger-hdfc",
              side: "debit",
              amount: 22000,
              note: "Bank receipt updated.",
            },
            {
              ledgerId: "ledger-sundry-debtors",
              side: "credit",
              amount: 22000,
              note: "Receivable settled updated.",
            },
          ],
          billAllocations: [
            {
              referenceType: "against_ref",
              referenceNumber: "SAL-2026-001",
              referenceDate: "2026-03-24",
              dueDate: "2026-04-12",
              amount: 22000,
              note: "Updated settlement",
            },
          ],
          gst: null,
          transport: null,
          generateEInvoice: false,
          generateEWayBill: false,
        }
      )

      assert.equal(updated.item.counterparty, "Aarav Retail LLP")
      assert.equal(updated.item.lines[0]?.amount, 22000)

      const gstSales = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-099",
        type: "sales",
        date: "2026-04-01",
        counterparty: "Karnataka Retail Hub",
        narration: "GST sales invoice auto-posted.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "6204",
          taxableAmount: 50000,
          taxRate: 12,
          taxableLedgerId: "ledger-sales",
          partyLedgerId: "ledger-sundry-debtors",
        },
        transport: {
          distanceKm: 180,
          vehicleNumber: "KA01AB1234",
          transporterId: "TRANS001",
        },
        generateEInvoice: true,
        generateEWayBill: true,
      })

      assert.equal(gstSales.item.financialYear.code, "FY2026-27")
      assert.equal(gstSales.item.gst?.invoiceAmount, 56000)
      assert.equal(gstSales.item.gst?.cgstAmount, 3000)
      assert.equal(gstSales.item.gst?.sgstAmount, 3000)
      assert.equal(gstSales.item.gst?.igstAmount, 0)
      assert.equal(gstSales.item.lines.length, 4)
      assert.equal(gstSales.item.eInvoice.status, "pending")
      assert.equal(gstSales.item.eWayBill.status, "pending")
      assert.equal(gstSales.item.lines[0]?.side, "debit")
      assert.equal(gstSales.item.lines[0]?.amount, 56000)

      await assert.rejects(
        () =>
          createBillingVoucher(runtime.primary, adminUser, config, {
            voucherNumber: "BAD-2026-001",
            type: "journal",
            date: "2026-04-01",
            counterparty: "Mismatch",
            narration: "Unbalanced voucher should fail.",
            lines: [
              {
                ledgerId: "ledger-rent",
                side: "debit",
                amount: 15000,
                note: "Expense booked.",
              },
              {
                ledgerId: "ledger-sundry-creditors",
                side: "credit",
                amount: 12000,
                note: "Wrong amount.",
              },
            ],
            billAllocations: [],
            gst: null,
            transport: null,
            generateEInvoice: false,
            generateEWayBill: false,
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 400 &&
          error.message.includes("not balanced")
      )

      const deleted = await deleteBillingVoucher(
        runtime.primary,
        adminUser,
        created.item.id
      )

      assert.equal(deleted.deleted, true)

      const listedAfterDelete = await listBillingVouchers(runtime.primary, adminUser)
      assert.equal(
        listedAfterDelete.items.some((item) => item.id === created.item.id),
        false
      )
      assert.equal(
        listedAfterDelete.items.some((item) => item.id === gstSales.item.id),
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
