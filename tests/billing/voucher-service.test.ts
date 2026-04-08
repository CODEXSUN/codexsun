import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createBillingVoucher,
  deleteBillingVoucher,
  getBillingVoucherDocument,
  listBillingVouchers,
  reconcileBillingVoucher,
  reverseBillingVoucher,
  reviewBillingVoucher,
  updateBillingVoucher,
} from "../../apps/billing/src/services/voucher-service.js"
import { billingTableNames } from "../../apps/billing/database/table-names.js"
import { getBillingAuditTrailReview } from "../../apps/billing/src/services/audit-trail-service.js"
import { executeBillingOpeningBalanceRollover } from "../../apps/billing/src/services/opening-balance-rollover-service.js"
import { executeBillingYearEndAdjustmentControl } from "../../apps/billing/src/services/year-end-control-service.js"
import { executeBillingYearCloseWorkflow } from "../../apps/billing/src/services/year-close-service.js"
import { listBillingVoucherHeaders } from "../../apps/billing/src/services/voucher-header-store.js"
import { listBillingVoucherLines } from "../../apps/billing/src/services/voucher-line-store.js"
import { listBillingLedgerEntries } from "../../apps/billing/src/services/ledger-entry-store.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"
import { ApplicationError } from "../../apps/framework/src/runtime/errors/application-error.js"
import { listActivityLogs } from "../../apps/framework/src/runtime/activity-log/activity-log-service.js"
import { getProduct, listProducts } from "../../apps/core/src/services/product-service.js"

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
        status: "draft",
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
      assert.equal(created.item.status, "draft")
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
          status: "draft",
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
      assert.equal(updated.item.status, "draft")
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
      assert.equal(gstSales.item.status, "posted")
      assert.equal(gstSales.item.gst?.invoiceAmount, 56000)
      assert.equal(gstSales.item.gst?.cgstAmount, 3000)
      assert.equal(gstSales.item.gst?.sgstAmount, 3000)
      assert.equal(gstSales.item.gst?.igstAmount, 0)
      assert.equal(gstSales.item.lines.length, 4)
      assert.equal(gstSales.item.eInvoice.status, "pending")
      assert.equal(gstSales.item.eWayBill.status, "pending")
      assert.equal(gstSales.item.lines[0]?.side, "debit")
      assert.equal(gstSales.item.lines[0]?.amount, 56000)

      const invoiceSales = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-100",
        type: "sales",
        date: "2026-04-02",
        counterparty: "",
        narration: "Invoice-style sales voucher with item rows.",
        lines: [],
        billAllocations: [],
        gst: null,
        sales: {
          voucherTypeId: "voucher-type-fabric-sales",
          customerLedgerId: "ledger-sundry-debtors",
          billToName: "Nila Textiles",
          billToAddress: "15 Market Road, Bengaluru",
          shipToName: "Nila Textiles DC",
          shipToAddress: "Dock 2, Peenya, Bengaluru",
          dueDate: "2026-04-12",
          referenceNumber: "PO-1182",
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          taxRate: 5,
          items: [
            {
              itemName: "Cotton Fabric Roll",
              description: "Dyed cotton export quality",
              hsnOrSac: "5208",
              quantity: 20,
              unit: "Roll",
              rate: 1500,
            },
            {
              itemName: "Linen Fabric Roll",
              description: "Premium linen batch",
              hsnOrSac: "5309",
              quantity: 10,
              unit: "Roll",
              rate: 2200,
            },
          ],
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      assert.equal(invoiceSales.item.counterparty, "Nila Textiles")
      assert.equal(invoiceSales.item.status, "posted")
      assert.equal(invoiceSales.item.sales?.voucherTypeName, "Fabric Sales")
      assert.equal(invoiceSales.item.sales?.items.length, 2)
      assert.equal(invoiceSales.item.sales?.subtotal, 52000)
      assert.equal(invoiceSales.item.sales?.taxAmount, 2600)
      assert.equal(invoiceSales.item.sales?.grandTotal, 54600)
      assert.equal(invoiceSales.item.gst?.taxableLedgerId, "ledger-sales")
      assert.equal(invoiceSales.item.gst?.partyLedgerId, "ledger-sundry-debtors")
      assert.equal(invoiceSales.item.lines[0]?.amount, 54600)

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
        config,
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

      await assert.rejects(
        () =>
          updateBillingVoucher(runtime.primary, adminUser, config, gstSales.item.id, {
            voucherNumber: "SAL-2026-099",
            status: "posted",
            type: "sales",
            date: "2026-04-01",
            counterparty: "Karnataka Retail Hub Revised",
            narration: "Should not mutate posted voucher.",
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
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 409 &&
          error.message.includes("Only draft vouchers")
      )

      await assert.rejects(
        () => deleteBillingVoucher(runtime.primary, adminUser, config, gstSales.item.id),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 409 &&
          error.message.includes("Only draft vouchers")
      )

      const reversed = await reverseBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        gstSales.item.id,
        {
          reason: "Customer invoice entered with wrong party mapping.",
        }
      )

      assert.equal(reversed.item.status, "reversed")
      assert.equal(reversed.item.reversedByVoucherId, reversed.reversalItem.id)
      assert.equal(reversed.reversalItem.status, "posted")
      assert.equal(reversed.reversalItem.reversalOfVoucherId, gstSales.item.id)
      assert.equal(reversed.reversalItem.lines[0]?.side, "credit")
      assert.equal(reversed.reversalItem.lines[1]?.side, "debit")

      await assert.rejects(
        () =>
          reverseBillingVoucher(runtime.primary, adminUser, config, gstSales.item.id, {
            reason: "Second reversal should fail.",
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 409 &&
          error.message.includes("already been reversed")
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service validates financial year rollover, auto numbering, bill allocation totals, and explicit compliance modes", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-parameters-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.billing.compliance.eInvoice.enabled = true
    config.billing.compliance.eWayBill.enabled = true
    config.billing.compliance.eInvoice.mode = "manual"
    config.billing.compliance.eWayBill.mode = "manual"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const fyBoundaryVoucher = await createBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        {
          voucherNumber: "",
          type: "sales",
          date: "2026-03-31",
          counterparty: "Boundary Retail",
          narration: "Financial year boundary sales invoice.",
          lines: [],
          billAllocations: [],
          gst: {
            supplyType: "inter",
            placeOfSupply: "TN",
            partyGstin: "33ABCDE1234F1Z8",
            hsnOrSac: "6205",
            taxableAmount: 100000,
            taxRate: 18,
            taxableLedgerId: "ledger-sales",
            partyLedgerId: "ledger-sundry-debtors",
          },
          transport: {
            distanceKm: 420,
            vehicleNumber: "TN09CD4321",
            transporterId: "TRANS900",
          },
          generateEInvoice: true,
          generateEWayBill: true,
        }
      )

      assert.equal(fyBoundaryVoucher.item.financialYear.code, "FY2025-26")
      assert.equal(fyBoundaryVoucher.item.status, "posted")
      assert.equal(fyBoundaryVoucher.item.financialYear.startDate, "2025-04-01")
      assert.equal(fyBoundaryVoucher.item.financialYear.endDate, "2026-03-31")
      assert.match(fyBoundaryVoucher.item.voucherNumber, /^SAL-2025-26-\d{3}$/)
      assert.equal(fyBoundaryVoucher.item.gst?.igstAmount, 18000)
      assert.equal(fyBoundaryVoucher.item.gst?.cgstAmount, 0)
      assert.equal(fyBoundaryVoucher.item.eInvoice.status, "pending")
      assert.equal(fyBoundaryVoucher.item.eWayBill.status, "pending")
      assert.equal(fyBoundaryVoucher.item.eInvoice.irn, null)
      assert.equal(fyBoundaryVoucher.item.eWayBill.ewayBillNo, null)
      assert.match(fyBoundaryVoucher.item.eInvoice.errorMessage ?? "", /Manual compliance mode/i)
      assert.match(fyBoundaryVoucher.item.eWayBill.errorMessage ?? "", /Manual compliance mode/i)

      const fyNextVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "",
        type: "journal",
        date: "2026-04-01",
        counterparty: "Year Opening",
        narration: "New year adjustment entry.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 12000,
            note: "Expense booked.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 12000,
            note: "Liability recognized.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      assert.equal(fyNextVoucher.item.financialYear.code, "FY2026-27")
      assert.match(fyNextVoucher.item.voucherNumber, /^JRN-2026-27-\d{3}$/)

      const draftVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-405",
        status: "draft",
        type: "journal",
        date: "2026-04-04",
        counterparty: "Draft Adjustment",
        narration: "Lifecycle-only draft voucher baseline.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 3000,
            note: "Draft expense.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 3000,
            note: "Draft liability.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      assert.equal(draftVoucher.item.status, "draft")

      await assert.rejects(
        () =>
          createBillingVoucher(runtime.primary, adminUser, config, {
            voucherNumber: "RCPT-2026-555",
            type: "receipt",
            date: "2026-04-03",
            counterparty: "Mismatch Allocation",
            narration: "Receipt with wrong bill total.",
            lines: [
              {
                ledgerId: "ledger-hdfc",
                side: "debit",
                amount: 12000,
                note: "Bank receipt.",
              },
              {
                ledgerId: "ledger-sundry-debtors",
                side: "credit",
                amount: 12000,
                note: "Receivable settled.",
              },
            ],
            billAllocations: [
              {
                referenceType: "against_ref",
                referenceNumber: "SAL-2026-001",
                referenceDate: "2026-03-24",
                dueDate: "2026-04-10",
                amount: 8000,
                note: "Bad partial allocation",
              },
            ],
            gst: null,
            transport: null,
            generateEInvoice: false,
            generateEWayBill: false,
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 400 &&
          error.message.includes("allocation total")
      )

      await assert.rejects(
        () =>
          createBillingVoucher(runtime.primary, adminUser, config, {
            voucherNumber: "JRN-2026-404",
            type: "journal",
            date: "2026-04-03",
            counterparty: "Invalid Journal Ref",
            narration: "Journal should not accept bill refs.",
            lines: [
              {
                ledgerId: "ledger-rent",
                side: "debit",
                amount: 5000,
                note: "Expense booked.",
              },
              {
                ledgerId: "ledger-sundry-creditors",
                side: "credit",
                amount: 5000,
                note: "Liability booked.",
              },
            ],
            billAllocations: [
              {
                referenceType: "new_ref",
                referenceNumber: "REF-001",
                referenceDate: "2026-04-03",
                dueDate: "2026-04-30",
                amount: 5000,
                note: "Should fail",
              },
            ],
            gst: null,
            transport: null,
            generateEInvoice: false,
            generateEWayBill: false,
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 400 &&
          error.message.includes("supported only for payment and receipt")
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service writes audit logs for lifecycle actions when admin audit is enabled", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-audit-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.operations.audit.adminAuditEnabled = true

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const draftVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-610",
        status: "draft",
        type: "journal",
        date: "2026-04-12",
        counterparty: "Audit Draft Counterparty",
        narration: "Draft entry for audit trail.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 2500,
            note: "Draft debit.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 2500,
            note: "Draft credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const postedVoucher = await updateBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        draftVoucher.item.id,
        {
          voucherNumber: "JRN-2026-610",
          status: "posted",
          type: "journal",
          date: "2026-04-12",
          counterparty: "Audit Draft Counterparty",
          narration: "Draft posted for audit trail.",
          lines: [
            {
              ledgerId: "ledger-rent",
              side: "debit",
              amount: 2500,
              note: "Posted debit.",
            },
            {
              ledgerId: "ledger-sundry-creditors",
              side: "credit",
              amount: 2500,
              note: "Posted credit.",
            },
          ],
          billAllocations: [],
          gst: null,
          transport: null,
          generateEInvoice: false,
          generateEWayBill: false,
        }
      )

      const cancellableVoucher = await createBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        {
          voucherNumber: "JRN-2026-611",
          status: "draft",
          type: "journal",
          date: "2026-04-12",
          counterparty: "Audit Cancel Counterparty",
          narration: "Draft for cancel audit trail.",
          lines: [
            {
              ledgerId: "ledger-rent",
              side: "debit",
              amount: 1800,
              note: "Cancel debit.",
            },
            {
              ledgerId: "ledger-sundry-creditors",
              side: "credit",
              amount: 1800,
              note: "Cancel credit.",
            },
          ],
          billAllocations: [],
          gst: null,
          transport: null,
          generateEInvoice: false,
          generateEWayBill: false,
        }
      )

      await updateBillingVoucher(runtime.primary, adminUser, config, cancellableVoucher.item.id, {
        voucherNumber: "JRN-2026-611",
        status: "cancelled",
        type: "journal",
        date: "2026-04-12",
        counterparty: "Audit Cancel Counterparty",
        narration: "Draft cancelled for audit trail.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 1800,
            note: "Cancel debit.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 1800,
            note: "Cancel credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const deletableVoucher = await createBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        {
          voucherNumber: "JRN-2026-612",
          status: "draft",
          type: "journal",
          date: "2026-04-12",
          counterparty: "Audit Delete Counterparty",
          narration: "Draft deleted for audit trail.",
          lines: [
            {
              ledgerId: "ledger-rent",
              side: "debit",
              amount: 1400,
              note: "Delete debit.",
            },
            {
              ledgerId: "ledger-sundry-creditors",
              side: "credit",
              amount: 1400,
              note: "Delete credit.",
            },
          ],
          billAllocations: [],
          gst: null,
          transport: null,
          generateEInvoice: false,
          generateEWayBill: false,
        }
      )

      await deleteBillingVoucher(runtime.primary, adminUser, config, deletableVoucher.item.id)

      const reversibleVoucher = await createBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        {
          voucherNumber: "JRN-2026-613",
          status: "posted",
          type: "journal",
          date: "2026-04-12",
          counterparty: "Audit Reverse Counterparty",
          narration: "Posted for reversal audit trail.",
          lines: [
            {
              ledgerId: "ledger-rent",
              side: "debit",
              amount: 3200,
              note: "Reverse debit.",
            },
            {
              ledgerId: "ledger-sundry-creditors",
              side: "credit",
              amount: 3200,
              note: "Reverse credit.",
            },
          ],
          billAllocations: [],
          gst: null,
          transport: null,
          generateEInvoice: false,
          generateEWayBill: false,
        }
      )

      const reversal = await reverseBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        reversibleVoucher.item.id,
        {
          reason: "Audit reversal case.",
        }
      )

      const billingLogs = await listActivityLogs(runtime.primary, {
        category: "billing",
        limit: 20,
      })

      assert.equal(
        billingLogs.items.some(
          (item) =>
            item.action === "voucher_create" &&
            item.context?.voucherNumber === draftVoucher.item.voucherNumber
        ),
        true
      )
      assert.equal(
        billingLogs.items.some(
          (item) =>
            item.action === "voucher_post" &&
            item.context?.voucherNumber === postedVoucher.item.voucherNumber
        ),
        true
      )
      assert.equal(
        billingLogs.items.some(
          (item) =>
            item.action === "voucher_cancel" &&
            item.context?.voucherNumber === cancellableVoucher.item.voucherNumber
        ),
        true
      )
      assert.equal(
        billingLogs.items.some(
          (item) =>
            item.action === "voucher_delete" &&
            item.context?.voucherNumber === deletableVoucher.item.voucherNumber
        ),
        true
      )
      assert.equal(
        billingLogs.items.some(
          (item) =>
            item.action === "voucher_reverse" &&
            item.context?.voucherNumber === reversal.item.voucherNumber &&
            item.context?.reversalVoucherNumber === reversal.reversalItem.voucherNumber
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

test("billing voucher service keeps normalized voucher headers in sync with lifecycle changes", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-headers-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const createdDraft = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-700",
        status: "draft",
        type: "journal",
        date: "2026-04-13",
        counterparty: "Header Draft Counterparty",
        narration: "Header sync draft.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 2100,
            note: "Header draft debit.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 2100,
            note: "Header draft credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const headersAfterCreate = await listBillingVoucherHeaders(runtime.primary)
      const createdHeader = headersAfterCreate.items.find(
        (item) => item.voucherId === createdDraft.item.id
      )

      assert.ok(createdHeader)
      assert.equal(createdHeader.status, "draft")
      assert.equal(createdHeader.totalDebit, 2100)
      assert.equal(createdHeader.totalCredit, 2100)
      assert.equal(createdHeader.lineCount, 2)
      assert.equal(createdHeader.hasGst, false)

      const postedVoucher = await updateBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        createdDraft.item.id,
        {
          voucherNumber: "JRN-2026-700",
          status: "posted",
          type: "journal",
          date: "2026-04-13",
          counterparty: "Header Draft Counterparty",
          narration: "Header sync posted.",
          lines: [
            {
              ledgerId: "ledger-rent",
              side: "debit",
              amount: 2100,
              note: "Header draft debit.",
            },
            {
              ledgerId: "ledger-sundry-creditors",
              side: "credit",
              amount: 2100,
              note: "Header draft credit.",
            },
          ],
          billAllocations: [],
          gst: null,
          transport: null,
          generateEInvoice: false,
          generateEWayBill: false,
        }
      )

      const reversedVoucher = await reverseBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        postedVoucher.item.id,
        {
          reason: "Header sync reversal.",
        }
      )

      const headersAfterReverse = await listBillingVoucherHeaders(runtime.primary)
      const originalHeader = headersAfterReverse.items.find(
        (item) => item.voucherId === reversedVoucher.item.id
      )
      const reversalHeader = headersAfterReverse.items.find(
        (item) => item.voucherId === reversedVoucher.reversalItem.id
      )

      assert.ok(originalHeader)
      assert.ok(reversalHeader)
      assert.equal(originalHeader.status, "reversed")
      assert.equal(originalHeader.reversedByVoucherId, reversedVoucher.reversalItem.id)
      assert.equal(reversalHeader.reversalOfVoucherId, reversedVoucher.item.id)
      assert.equal(reversalHeader.status, "posted")

      const deletableVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-701",
        status: "draft",
        type: "journal",
        date: "2026-04-13",
        counterparty: "Header Delete Counterparty",
        narration: "Header sync delete.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 900,
            note: "Delete debit.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 900,
            note: "Delete credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await deleteBillingVoucher(runtime.primary, adminUser, config, deletableVoucher.item.id)

      const headersAfterDelete = await listBillingVoucherHeaders(runtime.primary)
      assert.equal(
        headersAfterDelete.items.some((item) => item.voucherId === deletableVoucher.item.id),
        false
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service keeps normalized voucher lines in sync with lifecycle changes", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-lines-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const createdDraft = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-710",
        status: "draft",
        type: "journal",
        date: "2026-04-13",
        counterparty: "Line Draft Counterparty",
        narration: "Line sync draft.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 1100,
            note: "Line debit one.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 1100,
            note: "Line credit one.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const linesAfterCreate = await listBillingVoucherLines(runtime.primary)
      const createdLines = linesAfterCreate.items.filter(
        (item) => item.voucherId === createdDraft.item.id
      )

      assert.equal(createdLines.length, 2)
      assert.equal(createdLines[0]?.lineOrder, 1)
      assert.equal(createdLines[0]?.voucherStatus, "draft")
      assert.equal(createdLines[0]?.amount, 1100)
      assert.equal(createdLines[1]?.side, "credit")

      const postedVoucher = await updateBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        createdDraft.item.id,
        {
          voucherNumber: "JRN-2026-710",
          status: "posted",
          type: "journal",
          date: "2026-04-13",
          counterparty: "Line Draft Counterparty",
          narration: "Line sync posted.",
          lines: [
            {
              ledgerId: "ledger-rent",
              side: "debit",
              amount: 1100,
              note: "Line debit one.",
            },
            {
              ledgerId: "ledger-sundry-creditors",
              side: "credit",
              amount: 1100,
              note: "Line credit one.",
            },
          ],
          billAllocations: [],
          gst: null,
          transport: null,
          generateEInvoice: false,
          generateEWayBill: false,
        }
      )

      const reversedVoucher = await reverseBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        postedVoucher.item.id,
        {
          reason: "Line sync reversal.",
        }
      )

      const linesAfterReverse = await listBillingVoucherLines(runtime.primary)
      const reversedOriginalLines = linesAfterReverse.items.filter(
        (item) => item.voucherId === reversedVoucher.item.id
      )
      const reversalLines = linesAfterReverse.items.filter(
        (item) => item.voucherId === reversedVoucher.reversalItem.id
      )

      assert.equal(reversedOriginalLines.length, 2)
      assert.equal(reversedOriginalLines[0]?.voucherStatus, "reversed")
      assert.equal(reversalLines.length, 2)
      assert.equal(reversalLines[0]?.voucherStatus, "posted")
      assert.equal(reversalLines[0]?.side, "credit")
      assert.equal(reversalLines[1]?.side, "debit")

      const deletableVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-711",
        status: "draft",
        type: "journal",
        date: "2026-04-13",
        counterparty: "Line Delete Counterparty",
        narration: "Line sync delete.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 700,
            note: "Delete line debit.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 700,
            note: "Delete line credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await deleteBillingVoucher(runtime.primary, adminUser, config, deletableVoucher.item.id)

      const linesAfterDelete = await listBillingVoucherLines(runtime.primary)
      assert.equal(
        linesAfterDelete.items.some((item) => item.voucherId === deletableVoucher.item.id),
        false
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service keeps immutable posted ledger entries in sync with posting lifecycle", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-ledger-entries-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const draftVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-720",
        status: "draft",
        type: "journal",
        date: "2026-04-13",
        counterparty: "Ledger Entry Draft Counterparty",
        narration: "Draft should not create posted entries.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 1500,
            note: "Draft debit.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 1500,
            note: "Draft credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const entriesAfterDraft = await listBillingLedgerEntries(runtime.primary)
      assert.equal(
        entriesAfterDraft.items.some((item) => item.voucherId === draftVoucher.item.id),
        false
      )

      const postedVoucher = await updateBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        draftVoucher.item.id,
        {
          voucherNumber: "JRN-2026-720",
          status: "posted",
          type: "journal",
          date: "2026-04-13",
          counterparty: "Ledger Entry Draft Counterparty",
          narration: "Posting creates ledger entries.",
          lines: [
            {
              ledgerId: "ledger-rent",
              side: "debit",
              amount: 1500,
              note: "Draft debit.",
            },
            {
              ledgerId: "ledger-sundry-creditors",
              side: "credit",
              amount: 1500,
              note: "Draft credit.",
            },
          ],
          billAllocations: [],
          gst: null,
          transport: null,
          generateEInvoice: false,
          generateEWayBill: false,
        }
      )

      const entriesAfterPost = await listBillingLedgerEntries(runtime.primary)
      const postedEntries = entriesAfterPost.items.filter(
        (item) => item.voucherId === postedVoucher.item.id
      )

      assert.equal(postedEntries.length, 2)
      assert.equal(postedEntries[0]?.voucherStatus, "posted")
      assert.equal(postedEntries[0]?.entryOrder, 1)
      assert.equal(postedEntries[1]?.side, "credit")

      const reversal = await reverseBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        postedVoucher.item.id,
        {
          reason: "Ledger entry reversal sync.",
        }
      )

      const entriesAfterReverse = await listBillingLedgerEntries(runtime.primary)
      const originalEntries = entriesAfterReverse.items.filter(
        (item) => item.voucherId === reversal.item.id
      )
      const reversalEntries = entriesAfterReverse.items.filter(
        (item) => item.voucherId === reversal.reversalItem.id
      )

      assert.equal(originalEntries.length, 2)
      assert.equal(originalEntries[0]?.voucherStatus, "reversed")
      assert.equal(reversalEntries.length, 2)
      assert.equal(reversalEntries[0]?.reversalOfVoucherId, reversal.item.id)
      assert.equal(reversalEntries[0]?.side, "credit")
      assert.equal(reversalEntries[1]?.side, "debit")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service persists matched and mismatched bank reconciliation state", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-bank-reconcile-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const postedVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "RCPT-2026-725",
        status: "posted",
        type: "receipt",
        date: "2026-04-14",
        counterparty: "Bank Recon Counterparty",
        narration: "Receipt awaiting statement matching.",
        lines: [
          {
            ledgerId: "ledger-hdfc",
            side: "debit",
            amount: 1800,
            note: "Bank receipt.",
          },
          {
            ledgerId: "ledger-sundry-debtors",
            side: "credit",
            amount: 1800,
            note: "Customer settlement.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      assert.equal(postedVoucher.item.bankReconciliation.status, "pending")

      const matched = await reconcileBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        postedVoucher.item.id,
        {
          status: "matched",
          clearedDate: "2026-04-15",
          statementReference: "HDFC-STMT-001",
          statementAmount: 1800,
          note: "Matched with statement.",
        }
      )

      assert.equal(matched.item.bankReconciliation.status, "matched")
      assert.equal(matched.item.bankReconciliation.statementReference, "HDFC-STMT-001")
      assert.equal(matched.item.bankReconciliation.mismatchAmount, 0)

      const mismatched = await reconcileBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        postedVoucher.item.id,
        {
          status: "mismatch",
          clearedDate: "2026-04-16",
          statementReference: "HDFC-STMT-002",
          statementAmount: 1750,
          note: "Statement short by bank charge.",
        }
      )

      assert.equal(mismatched.item.bankReconciliation.status, "mismatch")
      assert.equal(mismatched.item.bankReconciliation.statementAmount, 1750)
      assert.equal(mismatched.item.bankReconciliation.mismatchAmount, 50)

      const resetPending = await reconcileBillingVoucher(
        runtime.primary,
        adminUser,
        config,
        postedVoucher.item.id,
        {
          status: "pending",
          note: "Reset for further review.",
        }
      )

      assert.equal(resetPending.item.bankReconciliation.status, "pending")
      assert.equal(resetPending.item.bankReconciliation.statementReference, null)
      assert.equal(resetPending.item.bankReconciliation.statementAmount, null)

      await assert.rejects(
        () =>
          reconcileBillingVoucher(runtime.primary, adminUser, config, "voucher-sales-001", {
            status: "matched",
            clearedDate: "2026-04-16",
            statementReference: "BAD-REF",
            statementAmount: 1000,
            note: "",
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 409 &&
          error.message.includes("bank-ledger movement")
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service supports credit note documents as first-class vouchers", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-credit-note-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const created = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "",
        status: "posted",
        type: "credit_note",
        sourceVoucherId: "voucher-sales-001",
        date: "2026-04-15",
        counterparty: "Maya Fashion House",
        narration: "Credit note for customer-side adjustment.",
        lines: [
          {
            ledgerId: "ledger-sales",
            side: "debit",
            amount: 5000,
            note: "Sales reversal component.",
          },
          {
            ledgerId: "ledger-sundry-debtors",
            side: "credit",
            amount: 5000,
            note: "Customer receivable reduced.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      assert.equal(created.item.type, "credit_note")
      assert.equal(created.item.status, "posted")
      assert.match(created.item.voucherNumber, /^CRN-2026-27-\d{3}$/)
      assert.equal(created.item.sourceDocument?.voucherId, "voucher-sales-001")
      assert.equal(created.item.sourceDocument?.voucherType, "sales")

      const listed = await listBillingVouchers(runtime.primary, adminUser, "credit_note")
      assert.equal(listed.items.some((item) => item.id === created.item.id), true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service auto-posts GST correctly for credit and debit notes under explicit compliance modes", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-note-gst-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.billing.compliance.eInvoice.enabled = true
    config.billing.compliance.eWayBill.enabled = true
    config.billing.compliance.eInvoice.mode = "manual"
    config.billing.compliance.eWayBill.mode = "live"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const creditNote = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "",
        status: "posted",
        type: "credit_note",
        sourceVoucherId: "voucher-sales-001",
        date: "2026-04-16",
        counterparty: "Maya Fashion House",
        narration: "GST-aware sales return credit note.",
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
        transport: {
          distanceKm: 60,
          vehicleNumber: "KA01AB1234",
          transporterId: "TRANS110",
        },
        generateEInvoice: true,
        generateEWayBill: true,
      })

      assert.equal(creditNote.item.gst?.taxDirection, "output")
      assert.equal(creditNote.item.lines[0]?.side, "debit")
      assert.equal(creditNote.item.lines[1]?.side, "debit")
      assert.equal(creditNote.item.lines[3]?.side, "credit")
      assert.equal(creditNote.item.eInvoice.status, "pending")
      assert.equal(creditNote.item.eWayBill.status, "pending")
      assert.match(creditNote.item.eInvoice.errorMessage ?? "", /Manual compliance mode/i)
      assert.match(creditNote.item.eWayBill.errorMessage ?? "", /Live e-way bill mode/i)

      const debitNote = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "",
        status: "posted",
        type: "debit_note",
        sourceVoucherId: "voucher-purchase-001",
        date: "2026-04-16",
        counterparty: "Raj Suppliers",
        narration: "GST-aware purchase return debit note.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "5208",
          taxableAmount: 8000,
          taxRate: 12,
          taxableLedgerId: "ledger-purchase",
          partyLedgerId: "ledger-sundry-creditors",
        },
        transport: {
          distanceKm: 40,
          vehicleNumber: "KA05CD4321",
          transporterId: "TRANS220",
        },
        generateEInvoice: true,
        generateEWayBill: true,
      })

      assert.equal(debitNote.item.gst?.taxDirection, "input")
      assert.equal(debitNote.item.lines[0]?.side, "debit")
      assert.equal(debitNote.item.lines[1]?.side, "credit")
      assert.equal(debitNote.item.lines[3]?.side, "credit")
      assert.equal(debitNote.item.eInvoice.status, "pending")
      assert.equal(debitNote.item.eWayBill.status, "pending")
      assert.match(debitNote.item.eInvoice.errorMessage ?? "", /Manual compliance mode/i)
      assert.match(debitNote.item.eWayBill.errorMessage ?? "", /Live e-way bill mode/i)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service supports debit note documents as first-class vouchers", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-debit-note-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const created = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "",
        status: "posted",
        type: "debit_note",
        sourceVoucherId: "voucher-purchase-001",
        date: "2026-04-15",
        counterparty: "Raj Suppliers",
        narration: "Debit note for supplier-side adjustment.",
        lines: [
          {
            ledgerId: "ledger-sundry-creditors",
            side: "debit",
            amount: 4200,
            note: "Supplier payable adjusted.",
          },
          {
            ledgerId: "ledger-purchase",
            side: "credit",
            amount: 4200,
            note: "Purchase correction component.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      assert.equal(created.item.type, "debit_note")
      assert.equal(created.item.status, "posted")
      assert.match(created.item.voucherNumber, /^DBN-2026-27-\d{3}$/)
      assert.equal(created.item.sourceDocument?.voucherId, "voucher-purchase-001")
      assert.equal(created.item.sourceDocument?.voucherType, "purchase")

      const listed = await listBillingVouchers(runtime.primary, adminUser, "debit_note")
      assert.equal(listed.items.some((item) => item.id === created.item.id), true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service enforces source document linkage rules for credit and debit notes", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-note-linkage-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await assert.rejects(
        () =>
          createBillingVoucher(runtime.primary, adminUser, config, {
            voucherNumber: "",
            status: "posted",
            type: "credit_note",
            sourceVoucherId: "voucher-purchase-001",
            date: "2026-04-15",
            counterparty: "Bad Link",
            narration: "Credit note linked to purchase should fail.",
            lines: [
              {
                ledgerId: "ledger-sales",
                side: "debit",
                amount: 1000,
                note: "Bad debit.",
              },
              {
                ledgerId: "ledger-sundry-debtors",
                side: "credit",
                amount: 1000,
                note: "Bad credit.",
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
          error.statusCode === 409 &&
          error.message.includes("must reference a sales voucher")
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service enforces lock date and closed period rules on create update and reverse", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-period-locks-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.billing.compliance.lockDate = "2026-04-05"
    config.billing.compliance.periodClosedThrough = "2026-04-10"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await assert.rejects(
        () =>
          createBillingVoucher(runtime.primary, adminUser, config, {
            voucherNumber: "JRN-2026-500",
            status: "draft",
            type: "journal",
            date: "2026-04-10",
            counterparty: "Closed Period Entry",
            narration: "Should fail due to closed period.",
            lines: [
              {
                ledgerId: "ledger-rent",
                side: "debit",
                amount: 5000,
                note: "Expense",
              },
              {
                ledgerId: "ledger-sundry-creditors",
                side: "credit",
                amount: 5000,
                note: "Liability",
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
          error.statusCode === 409 &&
          error.message.includes("blocked")
      )

      const mutableDraft = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-501",
        status: "draft",
        type: "journal",
        date: "2026-04-11",
        counterparty: "Open Period Draft",
        narration: "Created in open period.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 5000,
            note: "Expense",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 5000,
            note: "Liability",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await assert.rejects(
        () =>
          updateBillingVoucher(runtime.primary, adminUser, config, mutableDraft.item.id, {
            voucherNumber: "JRN-2026-501",
            status: "draft",
            type: "journal",
            date: "2026-04-09",
            counterparty: "Backdated Draft",
            narration: "Should fail because date is closed.",
            lines: [
              {
                ledgerId: "ledger-rent",
                side: "debit",
                amount: 5000,
                note: "Expense",
              },
              {
                ledgerId: "ledger-sundry-creditors",
                side: "credit",
                amount: 5000,
                note: "Liability",
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
          error.statusCode === 409 &&
          error.message.includes("blocked")
      )

      const postedVoucher = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-502",
        status: "posted",
        type: "journal",
        date: "2026-04-11",
        counterparty: "Posted Open Period",
        narration: "Posted in open period for reversal test.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 4200,
            note: "Expense",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 4200,
            note: "Liability",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await assert.rejects(
        () =>
          reverseBillingVoucher(runtime.primary, adminUser, config, postedVoucher.item.id, {
            reason: "Backdated reversal should fail.",
            date: "2026-04-08",
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 409 &&
          error.message.includes("blocked")
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing audit trail review summarizes billing activity log entries", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-audit-review-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.operations.audit.adminAuditEnabled = true

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const created = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-760",
        status: "draft",
        type: "journal",
        date: "2026-04-15",
        counterparty: "Audit Review Counterparty",
        narration: "Draft entry for audit review.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 1800,
            note: "Draft debit.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 1800,
            note: "Draft credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await updateBillingVoucher(runtime.primary, adminUser, config, created.item.id, {
        voucherNumber: "JRN-2026-760",
        status: "posted",
        type: "journal",
        date: "2026-04-15",
        counterparty: "Audit Review Counterparty",
        narration: "Posted entry for audit review.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 1800,
            note: "Posted debit.",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 1800,
            note: "Posted credit.",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const review = await getBillingAuditTrailReview(runtime.primary, adminUser)

      assert.equal(review.item.totalEntries >= 2, true)
      assert.equal(review.item.createCount >= 1, true)
      assert.equal(review.item.postCount >= 1, true)
      assert.equal(
        review.item.items.some(
          (item) =>
            item.voucherId === created.item.id &&
            item.voucherNumber === "JRN-2026-760"
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

test("billing voucher service supports return workflows and numbering policy controls", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-returns-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.billing.compliance.documentNumbering.policy = "auto"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await assert.rejects(
        () =>
          createBillingVoucher(runtime.primary, adminUser, config, {
            voucherNumber: "SRT-MANUAL-001",
            status: "posted",
            type: "sales_return",
            sourceVoucherId: "voucher-sales-001",
            date: "2026-04-14",
            counterparty: "Maya Fashion House",
            narration: "Manual numbering should be blocked in auto mode.",
            lines: [],
            billAllocations: [],
            gst: {
              supplyType: "intra",
              placeOfSupply: "KA",
              partyGstin: "29ABCDE1234F1Z5",
              hsnOrSac: "6204",
              taxableAmount: 1000,
              taxRate: 5,
              taxableLedgerId: "ledger-sales",
              partyLedgerId: "ledger-sundry-debtors",
            },
            transport: null,
            generateEInvoice: false,
            generateEWayBill: false,
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 409 &&
          error.message.includes("Manual voucher numbers are disabled")
      )

      const salesReturn = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "",
        status: "posted",
        type: "sales_return",
        sourceVoucherId: "voucher-sales-001",
        date: "2026-04-14",
        counterparty: "Maya Fashion House",
        narration: "Returned two rolls against sales invoice.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "6204",
          taxableAmount: 12000,
          taxRate: 5,
          taxableLedgerId: "ledger-sales",
          partyLedgerId: "ledger-sundry-debtors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      assert.equal(salesReturn.item.type, "sales_return")
      assert.equal(salesReturn.item.sourceDocument?.voucherId, "voucher-sales-001")
      assert.match(salesReturn.item.voucherNumber, /^SRT-/)
      assert.equal(salesReturn.item.gst?.taxDirection, "output")

      const purchaseReturn = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "",
        status: "posted",
        type: "purchase_return",
        sourceVoucherId: "voucher-purchase-001",
        date: "2026-04-15",
        counterparty: "Northwind Textiles LLP",
        narration: "Returned damaged lot to supplier.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "inter",
          placeOfSupply: "TN",
          partyGstin: "33AAACS4321P1Z1",
          hsnOrSac: "6205",
          taxableAmount: 15000,
          taxRate: 12,
          taxableLedgerId: "ledger-purchase",
          partyLedgerId: "ledger-sundry-creditors",
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      assert.equal(purchaseReturn.item.type, "purchase_return")
      assert.equal(purchaseReturn.item.sourceDocument?.voucherId, "voucher-purchase-001")
      assert.match(purchaseReturn.item.voucherNumber, /^PRT-/)
      assert.equal(purchaseReturn.item.gst?.taxDirection, "input")

      config.billing.compliance.documentNumbering.policy = "manual"

      await assert.rejects(
        () =>
          createBillingVoucher(runtime.primary, adminUser, config, {
            voucherNumber: "",
            status: "draft",
            type: "journal",
            date: "2026-04-16",
            counterparty: "Manual policy",
            narration: "Manual numbering is required here.",
            lines: [
              {
                ledgerId: "ledger-rent",
                side: "debit",
                amount: 1000,
                note: "Expense",
              },
              {
                ledgerId: "ledger-sundry-creditors",
                side: "credit",
                amount: 1000,
                note: "Liability",
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
          error.statusCode === 409 &&
          error.message.includes("Manual voucher number is required")
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service supports sensitive review flow and document export templates", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-review-"))

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
        voucherNumber: "PAY-2026-811",
        status: "posted",
        type: "payment",
        date: "2026-04-18",
        counterparty: "Sensitive Supplier",
        narration: "High-value payment that should enter review.",
        lines: [
          {
            ledgerId: "ledger-sundry-creditors",
            side: "debit",
            amount: 30000,
            note: "Supplier settlement",
          },
          {
            ledgerId: "ledger-hdfc",
            side: "credit",
            amount: 30000,
            note: "Bank payout",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      assert.equal(created.item.review.status, "pending_review")
      assert.equal(created.item.review.approvalPolicy, "maker_checker")
      assert.equal(created.item.review.requestedByUserId, adminUser.id)
      assert.equal(created.item.review.makerCheckerRequired, true)

      await assert.rejects(
        () =>
          reviewBillingVoucher(runtime.primary, adminUser, config, created.item.id, {
            status: "approved",
            note: "Maker and checker cannot be the same person.",
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 409 &&
          error.message.includes("Maker-checker approval requires a different reviewer")
      )

      const reviewed = await reviewBillingVoucher(
        runtime.primary,
        financeManagerUser,
        config,
        created.item.id,
        {
          status: "approved",
          note: "Verified by finance manager.",
        }
      )

      assert.equal(reviewed.item.review.status, "approved")
      assert.equal(reviewed.item.review.reviewedByUserId, financeManagerUser.id)

      const printDocument = await getBillingVoucherDocument(
        runtime.primary,
        adminUser,
        created.item.id,
        "print"
      )
      const csvDocument = await getBillingVoucherDocument(
        runtime.primary,
        adminUser,
        created.item.id,
        "csv"
      )
      const jsonDocument = await getBillingVoucherDocument(
        runtime.primary,
        adminUser,
        created.item.id,
        "json"
      )

      assert.equal(printDocument.item.mimeType, "text/html")
      assert.match(printDocument.item.content, /Payment Voucher/)
      assert.equal(csvDocument.item.mimeType, "text/csv")
      assert.match(csvDocument.item.content, /Review Status/)
      assert.equal(jsonDocument.item.mimeType, "application\/json")
      assert.match(jsonDocument.item.content, /approved/)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service persists accounting dimensions on vouchers and normalized headers", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-dimensions-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const created = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-950",
        status: "posted",
        type: "journal",
        sourceVoucherId: null,
        dimensions: {
          branch: "Bengaluru HQ",
          project: "Q2 Close",
          costCenter: "Finance Ops",
        },
        date: "2026-04-22",
        counterparty: "Internal Control",
        narration: "Journal with dimensions.",
        lines: [
          {
            ledgerId: "ledger-rent",
            side: "debit",
            amount: 1200,
            note: "Expense",
          },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 1200,
            note: "Liability",
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

      assert.equal(created.item.dimensions.branch, "Bengaluru HQ")
      assert.equal(created.item.dimensions.project, "Q2 Close")
      assert.equal(created.item.dimensions.costCenter, "Finance Ops")

      const headers = await listBillingVoucherHeaders(runtime.primary)
      const createdHeader = headers.items.find((item) => item.voucherId === created.item.id)

      assert.ok(createdHeader)
      assert.equal(createdHeader.dimensions.branch, "Bengaluru HQ")
      assert.equal(createdHeader.reviewApprovalPolicy, "maker_checker")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing year-close workflow previews and closes the selected billing financial year", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-year-close-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const preview = await executeBillingYearCloseWorkflow(runtime.primary, financeManagerUser, config, {
        action: "preview",
        financialYearCode: "FY2025-26",
        note: "Preview before close.",
      })

      assert.equal(preview.item.status, "ready_to_close")
      assert.equal(preview.item.financialYearCode, "FY2025-26")

      const closed = await executeBillingYearCloseWorkflow(runtime.primary, financeManagerUser, config, {
        action: "close",
        financialYearCode: "FY2025-26",
        note: "Close after preview.",
      })

      assert.equal(closed.item.status, "closed")
      assert.equal(closed.item.financialYearCode, "FY2025-26")
      assert.equal(closed.item.closedByUserId, financeManagerUser.id)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing opening-balance rollover previews and applies after a closed financial year", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-opening-rollover-"))

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
        note: "Close before rollover.",
      })

      const preview = await executeBillingOpeningBalanceRollover(
        runtime.primary,
        financeManagerUser,
        {
          action: "preview",
          sourceFinancialYearCode: "FY2025-26",
          note: "Preview carry-forward balances.",
        }
      )

      assert.equal(preview.item.status, "previewed")
      assert.equal(preview.item.sourceFinancialYearCode, "FY2025-26")
      assert.equal(preview.item.targetFinancialYearCode, "FY2026-27")
      assert.equal(preview.item.carryForwardLedgerCount > 0, true)
      assert.equal(preview.item.resetLedgerCount > 0, true)
      assert.equal(
        preview.item.items.some(
          (item) =>
            item.ledgerNature === "asset" &&
            item.policyTreatment === "carry_forward" &&
            item.rolloverAmount === item.sourceClosingAmount
        ),
        true
      )
      assert.equal(
        preview.item.items.some(
          (item) =>
            item.ledgerNature === "expense" &&
            item.policyTreatment === "reset_nominal" &&
            item.rolloverAmount === 0
        ),
        true
      )

      const applied = await executeBillingOpeningBalanceRollover(
        runtime.primary,
        financeManagerUser,
        {
          action: "apply",
          sourceFinancialYearCode: "FY2025-26",
          note: "Apply carry-forward balances.",
        }
      )

      assert.equal(applied.item.status, "applied")
      assert.equal(applied.item.appliedByUserId, financeManagerUser.id)
      assert.equal(applied.item.targetFinancialYearCode, "FY2026-27")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing year-end controls preview and apply after rollover preparation", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-year-end-controls-"))

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
        note: "Close before year-end controls.",
      })

      await executeBillingOpeningBalanceRollover(runtime.primary, financeManagerUser, {
        action: "apply",
        sourceFinancialYearCode: "FY2025-26",
        note: "Apply rollover before year-end controls.",
      })

      const preview = await executeBillingYearEndAdjustmentControl(
        runtime.primary,
        financeManagerUser,
        {
          action: "preview",
          sourceFinancialYearCode: "FY2025-26",
          note: "Preview year-end controls.",
        }
      )

      assert.equal(preview.item.status, "previewed")
      assert.equal(preview.item.sourceFinancialYearCode, "FY2025-26")
      assert.equal(preview.item.targetFinancialYearCode, "FY2026-27")
      assert.equal(preview.item.carryForwardLedgerCount > 0, true)
      assert.equal(preview.item.nominalLedgerCount > 0, true)
      assert.equal(
        preview.item.items.some((item) => item.controlKey === "opening-balance-rollover"),
        true
      )

      const applied = await executeBillingYearEndAdjustmentControl(
        runtime.primary,
        financeManagerUser,
        {
          action: "apply",
          sourceFinancialYearCode: "FY2025-26",
          note: "Apply year-end controls.",
        }
      )

      assert.equal(applied.item.status, "applied")
      assert.equal(applied.item.appliedByUserId, financeManagerUser.id)
      assert.equal(applied.item.targetFinancialYearCode, "FY2026-27")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("billing voucher service bridges purchase receipts and sales issues into core stock", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-stock-bridge-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const products = await listProducts(runtime.primary)
      const productId = products.items[0]?.id

      assert.ok(productId)

      const beforeProduct = await getProduct(runtime.primary, adminUser, productId)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PUR-2026-880",
        status: "posted",
        type: "purchase",
        date: "2026-04-19",
        counterparty: "Northwind Textiles LLP",
        narration: "Purchase receipt with stock bridge.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29AAACS4321P1Z1",
          hsnOrSac: "6204",
          taxableAmount: 1000,
          taxRate: 5,
          taxableLedgerId: "ledger-purchase",
          partyLedgerId: "ledger-sundry-creditors",
        },
        stock: {
          items: [
            {
              productId,
              warehouseId: "warehouse:default",
              quantity: 5,
              unit: "Nos",
              unitCost: 200,
              landedCostAmount: 0,
              note: "Received into stock",
            },
          ],
        },
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-880",
        status: "posted",
        type: "sales",
        date: "2026-04-20",
        counterparty: "Maya Fashion House",
        narration: "Sales issue with product-linked stock reduction.",
        lines: [],
        billAllocations: [],
        gst: null,
        sales: {
          voucherTypeId: "voucher-type-garment-sales",
          customerLedgerId: "ledger-sundry-debtors",
          billToName: "Maya Fashion House",
          billToAddress: "Bengaluru",
          shipToName: "Maya Fashion House",
          shipToAddress: "Bengaluru",
          dueDate: "2026-04-25",
          referenceNumber: "PO-STOCK-001",
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29AABCN1234D1Z5",
          taxRate: 5,
          items: [
            {
              productId,
              warehouseId: "warehouse:default",
              itemName: beforeProduct.item.name,
              description: "Stock-linked sale",
              hsnOrSac: "6204",
              quantity: 2,
              unit: "Nos",
              rate: 400,
            },
          ],
        },
        stock: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const afterProduct = await getProduct(runtime.primary, adminUser, productId)

      assert.equal(afterProduct.item.totalStockQuantity, beforeProduct.item.totalStockQuantity + 3)
      assert.equal(
        afterProduct.item.stockMovements.some(
          (movement) =>
            movement.referenceType === "billing_voucher" &&
            movement.movementType === "billing_purchase_receipt"
        ),
        true
      )
      assert.equal(
        afterProduct.item.stockMovements.some(
          (movement) =>
            movement.referenceType === "billing_voucher" &&
            movement.movementType === "billing_sales_issue"
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

test("billing voucher service syncs item split tables for major voucher families", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-split-items-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const products = await listProducts(runtime.primary)
      const productId = products.items[0]?.id

      assert.ok(productId)

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-SPLIT",
        type: "sales",
        date: "2026-04-21",
        counterparty: "",
        narration: "Sales invoice for split-table sync.",
        lines: [],
        billAllocations: [],
        gst: null,
        sales: {
          voucherTypeId: "voucher-type-fabric-sales",
          customerLedgerId: "ledger-sundry-debtors",
          billToName: "Split Customer",
          billToAddress: "Bengaluru",
          shipToName: "Split Customer",
          shipToAddress: "Bengaluru",
          dueDate: "2026-04-30",
          referenceNumber: "PO-SPLIT-001",
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          taxRate: 5,
          items: [
            {
              productId,
              warehouseId: "warehouse:default",
              itemName: "Cotton Roll",
              description: "Line one",
              hsnOrSac: "5208",
              quantity: 2,
              unit: "Nos",
              rate: 500,
            },
            {
              productId,
              warehouseId: "warehouse:default",
              itemName: "Linen Roll",
              description: "Line two",
              hsnOrSac: "5309",
              quantity: 1,
              unit: "Nos",
              rate: 800,
            },
          ],
        },
        stock: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PUR-2026-SPLIT",
        status: "posted",
        type: "purchase",
        date: "2026-04-21",
        counterparty: "Split Supplier",
        narration: "Purchase invoice for split-table sync.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29AAACS4321P1Z1",
          hsnOrSac: "5208",
          taxableAmount: 1000,
          taxRate: 5,
          taxableLedgerId: "ledger-purchase",
          partyLedgerId: "ledger-sundry-creditors",
        },
        stock: {
          items: [
            {
              productId,
              warehouseId: "warehouse:default",
              quantity: 5,
              unit: "Nos",
              unitCost: 200,
              landedCostAmount: 0,
              note: "Stock receipt",
            },
          ],
        },
        transport: null,
        sales: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "RCPT-2026-SPLIT",
        status: "posted",
        type: "receipt",
        date: "2026-04-22",
        counterparty: "Split Customer",
        narration: "Receipt allocation split.",
        lines: [
          { ledgerId: "ledger-hdfc", side: "debit", amount: 1000, note: "Bank" },
          {
            ledgerId: "ledger-sundry-debtors",
            side: "credit",
            amount: 1000,
            note: "Customer",
          },
        ],
        billAllocations: [
          {
            referenceType: "against_ref",
            referenceNumber: "SAL-2026-SPLIT",
            referenceDate: "2026-04-21",
            dueDate: "2026-04-30",
            amount: 1000,
            note: "Full allocation",
          },
        ],
        gst: null,
        transport: null,
        sales: null,
        stock: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "PAY-2026-SPLIT",
        status: "posted",
        type: "payment",
        date: "2026-04-22",
        counterparty: "Split Supplier",
        narration: "Payment allocation split.",
        lines: [
          {
            ledgerId: "ledger-sundry-creditors",
            side: "debit",
            amount: 1000,
            note: "Supplier",
          },
          { ledgerId: "ledger-hdfc", side: "credit", amount: 1000, note: "Bank" },
        ],
        billAllocations: [
          {
            referenceType: "against_ref",
            referenceNumber: "PUR-2026-SPLIT",
            referenceDate: "2026-04-21",
            dueDate: "2026-04-30",
            amount: 1000,
            note: "Full allocation",
          },
        ],
        gst: null,
        transport: null,
        sales: null,
        stock: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "JRN-2026-SPLIT",
        status: "posted",
        type: "journal",
        date: "2026-04-22",
        counterparty: "Internal",
        narration: "Journal line split.",
        lines: [
          { ledgerId: "ledger-rent", side: "debit", amount: 300, note: "Expense" },
          {
            ledgerId: "ledger-sundry-creditors",
            side: "credit",
            amount: 300,
            note: "Payable",
          },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        sales: null,
        stock: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "CON-2026-SPLIT",
        status: "posted",
        type: "contra",
        date: "2026-04-22",
        counterparty: "Internal Transfer",
        narration: "Contra line split.",
        lines: [
          { ledgerId: "ledger-cash", side: "credit", amount: 400, note: "Cash out" },
          { ledgerId: "ledger-hdfc", side: "debit", amount: 400, note: "Bank in" },
        ],
        billAllocations: [],
        gst: null,
        transport: null,
        sales: null,
        stock: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const salesItems = await runtime.primary
        .selectFrom(billingTableNames.salesItemVouchers)
        .selectAll()
        .execute()
      const purchaseItems = await runtime.primary
        .selectFrom(billingTableNames.purchaseItemVouchers)
        .selectAll()
        .execute()
      const receiptItems = await runtime.primary
        .selectFrom(billingTableNames.receiptItemVouchers)
        .selectAll()
        .execute()
      const paymentItems = await runtime.primary
        .selectFrom(billingTableNames.paymentItemVouchers)
        .selectAll()
        .execute()
      const journalItems = await runtime.primary
        .selectFrom(billingTableNames.journalItemVouchers)
        .selectAll()
        .execute()
      const contraItems = await runtime.primary
        .selectFrom(billingTableNames.contraItemVouchers)
        .selectAll()
        .execute()

      const splitSalesItems = salesItems.filter((item) => item.voucher_number === "SAL-2026-SPLIT")
      const splitPurchaseItems = purchaseItems.filter(
        (item) => item.voucher_number === "PUR-2026-SPLIT"
      )
      const splitReceiptItems = receiptItems.filter(
        (item) => item.voucher_number === "RCPT-2026-SPLIT"
      )
      const splitPaymentItems = paymentItems.filter(
        (item) => item.voucher_number === "PAY-2026-SPLIT"
      )
      const splitJournalItems = journalItems.filter(
        (item) => item.voucher_number === "JRN-2026-SPLIT"
      )
      const splitContraItems = contraItems.filter(
        (item) => item.voucher_number === "CON-2026-SPLIT"
      )

      assert.equal(splitSalesItems.length, 2)
      assert.equal(splitPurchaseItems.length, 1)
      assert.equal(splitReceiptItems.length, 1)
      assert.equal(splitPaymentItems.length, 1)
      assert.equal(splitJournalItems.length, 2)
      assert.equal(splitContraItems.length, 2)
      assert.equal(splitSalesItems[0]?.voucher_number, "SAL-2026-SPLIT")
      assert.equal(splitPurchaseItems[0]?.voucher_number, "PUR-2026-SPLIT")
      assert.equal(splitReceiptItems[0]?.reference_number, "SAL-2026-SPLIT")
      assert.equal(splitPaymentItems[0]?.reference_number, "PUR-2026-SPLIT")
      assert.equal(splitJournalItems[0]?.voucher_number, "JRN-2026-SPLIT")
      assert.equal(
        splitContraItems.every(
          (item) => item.account_type === "bank" || item.account_type === "cash"
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

test("billing voucher service syncs bill references settlements and overdue tracking", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-bill-engine-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const invoice = await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "SAL-2026-BILLREF",
        type: "sales",
        date: "2026-04-01",
        counterparty: "",
        narration: "Sales invoice for bill register.",
        lines: [],
        billAllocations: [],
        gst: null,
        sales: {
          voucherTypeId: "voucher-type-fabric-sales",
          customerLedgerId: "ledger-sundry-debtors",
          billToName: "Bill Ref Customer",
          billToAddress: "Bengaluru",
          shipToName: "Bill Ref Customer",
          shipToAddress: "Bengaluru",
          dueDate: "2026-04-10",
          referenceNumber: "PO-BILL-001",
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          taxRate: 10,
          items: [
            {
              itemName: "Fabric Lot",
              description: "Bill engine line",
              hsnOrSac: "5208",
              quantity: 2,
              unit: "Nos",
              rate: 500,
            },
          ],
        },
        stock: null,
        transport: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "RCPT-2026-BILLREF",
        status: "posted",
        type: "receipt",
        date: "2026-04-12",
        counterparty: "Bill Ref Customer",
        narration: "Partial settlement against invoice.",
        lines: [
          { ledgerId: "ledger-hdfc", side: "debit", amount: 400, note: "Bank" },
          {
            ledgerId: "ledger-sundry-debtors",
            side: "credit",
            amount: 400,
            note: "Customer",
          },
        ],
        billAllocations: [
          {
            referenceType: "against_ref",
            referenceNumber: "SAL-2026-BILLREF",
            referenceDate: "2026-04-01",
            dueDate: "2026-04-10",
            amount: 400,
            note: "Partial receipt",
          },
        ],
        gst: null,
        transport: null,
        sales: null,
        stock: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      await createBillingVoucher(runtime.primary, adminUser, config, {
        voucherNumber: "CRN-2026-BILLREF",
        status: "posted",
        type: "credit_note",
        sourceVoucherId: invoice.item.id,
        date: "2026-04-13",
        counterparty: "Bill Ref Customer",
        narration: "Credit note against original invoice.",
        lines: [],
        billAllocations: [],
        gst: {
          supplyType: "intra",
          placeOfSupply: "KA",
          partyGstin: "29ABCDE1234F1Z5",
          hsnOrSac: "5208",
          taxableAmount: 200,
          taxRate: 10,
          taxableLedgerId: "ledger-sales",
          partyLedgerId: "ledger-sundry-debtors",
        },
        transport: null,
        sales: null,
        stock: null,
        generateEInvoice: false,
        generateEWayBill: false,
      })

      const references = await runtime.primary
        .selectFrom(billingTableNames.billReferences)
        .selectAll()
        .where("ref_number", "=", "SAL-2026-BILLREF")
        .execute()
      const settlements = await runtime.primary
        .selectFrom(billingTableNames.billSettlements)
        .selectAll()
        .where("ref_number", "=", "SAL-2026-BILLREF")
        .execute()
      const overdue = await runtime.primary
        .selectFrom(billingTableNames.billOverdueTracking)
        .selectAll()
        .where("ref_number", "=", "SAL-2026-BILLREF")
        .execute()

      assert.equal(references.length, 1)
      assert.equal(settlements.length, 2)
      assert.equal(overdue.length, 1)
      assert.equal(references[0]?.direction, "receivable")
      assert.equal(references[0]?.original_amount, 1100)
      assert.equal(references[0]?.settled_amount, 400)
      assert.equal(references[0]?.discount_amount, 220)
      assert.equal(references[0]?.balance_amount, 480)
      assert.equal(references[0]?.status, "partial")
      assert.equal(
        settlements.some((item) => item.settlement_voucher_number === "RCPT-2026-BILLREF"),
        true
      )
      assert.equal(
        settlements.some((item) => item.settlement_voucher_number === "CRN-2026-BILLREF"),
        true
      )
      assert.equal(overdue[0]?.status, "overdue")
      assert.equal(overdue[0]?.bucket_key, "1_30")
      assert.equal(overdue[0]?.overdue_amount, 480)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
