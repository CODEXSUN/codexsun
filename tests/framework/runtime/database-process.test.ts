import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import type { Kysely } from "kysely"

import {
  commonModuleTableNames,
  coreTableNames,
} from "../../../apps/core/database/table-names.js"
import { cxappTableNames } from "../../../apps/cxapp/database/table-names.js"
import { coreMailboxArchiveMigration } from "../../../apps/cxapp/database/migration/08-mailbox-archive.js"
import { listCommonModuleSummaries } from "../../../apps/core/src/services/common-module-service.js"
import { listCompanies } from "../../../apps/cxapp/src/services/company-service.js"
import { listContacts } from "../../../apps/core/src/services/contact-service.js"
import { listProducts as listCoreProducts } from "../../../apps/core/src/services/product-service.js"
import { billingTableNames } from "../../../apps/billing/database/table-names.js"
import { listBillingLedgers } from "../../../apps/billing/src/services/ledger-service.js"
import { listBillingVouchers } from "../../../apps/billing/src/services/voucher-service.js"
import { ecommerceTableNames } from "../../../apps/ecommerce/database/table-names.js"
import { listFrappeItems } from "../../../apps/frappe/src/services/item-service.js"
import { listFrappePurchaseReceipts } from "../../../apps/frappe/src/services/purchase-receipt-service.js"
import { readFrappeSettings } from "../../../apps/frappe/src/services/settings-service.js"
import { listFrappeTodos } from "../../../apps/frappe/src/services/todo-service.js"
import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  listRegisteredDatabaseMigrations,
  listRegisteredDatabaseSeeders,
  prepareApplicationDatabase,
  systemMigrationTableName,
  systemSeederTableName,
} from "../../../apps/framework/src/runtime/database/index.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

test("registered database processes stay ordered by app and module", () => {
  assert.deepEqual(
    listRegisteredDatabaseMigrations().map((migration) => migration.id),
    [
      "framework:runtime:01-system-ledger",
      "framework:runtime:02-media-library",
      "framework:runtime:03-activity-log",
      "framework:runtime:04-monitoring-events",
      "framework:runtime:05-operations-governance",
      "framework:runtime:06-runtime-jobs",
      "cxapp:bootstrap:01-bootstrap",
      "cxapp:companies:02-companies",
      "cxapp:auth:05-auth-foundation",
      "cxapp:auth:06-auth-sessions",
      "cxapp:mailbox:07-mailbox",
      "cxapp:mailbox:08-mailbox-archive",
      "cxapp:auth:13-auth-permission-scope",
      "cxapp:auth:14-auth-option-catalog",
      "cxapp:auth:15-auth-hardening",
      "cxapp:companies:16-company-brand-asset-drafts",
      "core:contacts:03-contacts",
      "core:common-modules:04-common-modules",
      "core:common-modules:08-common-module-tables",
      "core:common-modules:09-common-module-table-backfill",
      "core:contacts:10-contact-code-backfill",
      "core:common-modules:11-common-module-seed-sync",
      "core:products:12-products",
      "billing:categories:01-categories",
      "billing:ledgers:02-ledgers",
      "billing:voucher-groups:02-voucher-groups",
      "billing:voucher-types:03-voucher-types",
      "billing:vouchers:03-vouchers",
      "billing:vouchers:04-voucher-headers",
      "billing:vouchers:05-voucher-lines",
      "billing:vouchers:06-ledger-entries",
      "billing:vouchers:07-accounting-controls",
      "billing:vouchers:08-sales-vouchers",
      "billing:vouchers:09-purchase-vouchers",
      "billing:vouchers:10-receipt-vouchers",
      "billing:vouchers:11-payment-vouchers",
      "billing:vouchers:12-journal-vouchers",
      "billing:vouchers:13-contra-vouchers",
      "billing:vouchers:14-petty-cash-vouchers",
      "billing:vouchers:15-bank-book-entries",
      "billing:vouchers:16-cash-book-entries",
      "billing:vouchers:17-sales-item-vouchers",
      "billing:vouchers:18-purchase-item-vouchers",
      "billing:vouchers:19-receipt-item-vouchers",
      "billing:vouchers:20-payment-item-vouchers",
      "billing:vouchers:21-journal-item-vouchers",
      "billing:vouchers:22-contra-item-vouchers",
      "billing:vouchers:23-bill-references",
      "billing:vouchers:24-bill-settlements",
      "billing:vouchers:25-bill-overdue-tracking",
      "ecommerce:storefront:01-storefront-foundation",
      "ecommerce:customer-portal:02-customer-portal",
      "ecommerce:customer-support:03-customer-support",
      "ecommerce:order-requests:04-order-requests",
      "ecommerce:storefront:05-storefront-settings-revisions",
      "ecommerce:storefront:06-storefront-settings-drafts",
      "ecommerce:storefront:07-ecommerce-settings",
      "frappe:settings:01-settings",
      "frappe:todos:02-todos",
      "frappe:items:03-items",
      "frappe:purchase-receipts:04-purchase-receipts",
      "frappe:item-sync-logs:05-item-product-sync-logs",
    ]
  )

  assert.deepEqual(
    listRegisteredDatabaseSeeders().map((seeder) => seeder.id),
    [
      "cxapp:bootstrap:01-bootstrap",
      "cxapp:companies:02-companies",
      "cxapp:auth:05-auth-foundation",
      "cxapp:mailbox:06-mailbox",
      "cxapp:auth:09-auth-option-catalog",
      "core:contacts:03-contacts",
      "core:common-modules:04-common-modules",
      "core:common-modules:07-common-module-tables",
      "core:products:08-products",
      "billing:categories:01-categories",
      "billing:ledgers:02-ledgers",
      "billing:voucher-groups:02-voucher-groups",
      "billing:vouchers:03-vouchers",
      "billing:voucher-types:03-voucher-types",
      "ecommerce:storefront:01-storefront-settings",
      "ecommerce:storefront:02-ecommerce-settings",
      "frappe:settings:01-settings",
      "frappe:todos:02-todos",
      "frappe:items:03-items",
      "frappe:purchase-receipts:04-purchase-receipts",
      "frappe:item-sync-logs:05-item-product-sync-logs",
    ]
  )
})

test("database prepare applies app-owned migrations and seeders with ecommerce storefront registered", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-db-prepare-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      const firstRun = await prepareApplicationDatabase(runtime)

      assert.equal(
        firstRun.migrations.applied.length,
        listRegisteredDatabaseMigrations().length
      )
      assert.equal(
        firstRun.seeders.applied.length,
        listRegisteredDatabaseSeeders().length
      )

      const secondRun = await prepareApplicationDatabase(runtime)

      assert.equal(secondRun.migrations.applied.length, 0)
      assert.equal(secondRun.seeders.applied.length, 0)
      assert.equal(
        secondRun.migrations.skipped.length,
        listRegisteredDatabaseMigrations().length
      )
      assert.equal(
        secondRun.seeders.skipped.length,
        listRegisteredDatabaseSeeders().length
      )

      const queryDatabase = runtime.primary as Kysely<DynamicDatabase>
      const appliedMigrations = await queryDatabase
        .selectFrom(systemMigrationTableName)
        .select(["id"])
        .execute()
      const appliedSeeders = await queryDatabase
        .selectFrom(systemSeederTableName)
        .select(["id"])
        .execute()
      const companyRows = await queryDatabase
        .selectFrom(cxappTableNames.companies)
        .select(["id"])
        .execute()
      const companyBrandDraftRows = await queryDatabase
        .selectFrom(cxappTableNames.companyBrandAssetDrafts)
        .select(["id"])
        .execute()
      const commonCategoryRows = await queryDatabase
        .selectFrom(commonModuleTableNames.productCategories)
        .select(["id"])
        .execute()
      const productRows = await queryDatabase
        .selectFrom(coreTableNames.products)
        .select(["id"])
        .execute()
      const billingVoucherRows = await queryDatabase
        .selectFrom(billingTableNames.vouchers)
        .select(["id"])
        .execute()
      const salesVoucherSplitRows = await queryDatabase
        .selectFrom(billingTableNames.salesVouchers)
        .select(["voucher_id"])
        .execute()
      const salesItemSplitRows = await queryDatabase
        .selectFrom(billingTableNames.salesItemVouchers)
        .select(["item_id"])
        .execute()
      const billReferenceRows = await queryDatabase
        .selectFrom(billingTableNames.billReferences)
        .select(["ref_id"])
        .execute()
      const storefrontSettingsRows = await queryDatabase
        .selectFrom(ecommerceTableNames.storefrontSettings)
        .select(["id"])
        .execute()
      const seededSuperAdmin = await queryDatabase
        .selectFrom(cxappTableNames.authUsers)
        .select(["email", "is_super_admin"])
        .where("id", "=", "auth-user:platform-admin")
        .executeTakeFirst()

      assert.equal(
        appliedMigrations.length,
        listRegisteredDatabaseMigrations().length
      )
      assert.equal(appliedSeeders.length, listRegisteredDatabaseSeeders().length)
      assert.equal(companyRows.length, 2)
      assert.equal(companyBrandDraftRows.length, 0)
      assert.equal(billingVoucherRows.length, 6)
      assert.equal(salesVoucherSplitRows.length, 0)
      assert.equal(salesItemSplitRows.length, 0)
      assert.equal(billReferenceRows.length, 0)
      assert.equal(storefrontSettingsRows.length, 1)
      assert.equal(commonCategoryRows.length, 6)
      assert.equal(productRows.length, 3)
      assert.equal(seededSuperAdmin?.email, "sundar@sundar.com")
      assert.equal(Number(seededSuperAdmin?.is_super_admin ?? 0), 1)

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
      const companies = await listCompanies(runtime.primary)
      const contacts = await listContacts(runtime.primary)
      const billingLedgers = await listBillingLedgers(runtime.primary)
      const billingVouchers = await listBillingVouchers(runtime.primary, adminUser)
      const commonModuleSummary = await listCommonModuleSummaries(runtime.primary)
      const products = await listCoreProducts(runtime.primary)
      const frappeSettings = await readFrappeSettings(runtime.primary, adminUser)
      const frappeTodos = await listFrappeTodos(runtime.primary, adminUser)
      const frappeItems = await listFrappeItems(runtime.primary, adminUser)
      const frappeReceipts = await listFrappePurchaseReceipts(runtime.primary, adminUser)

      assert.equal(companies.items.length, 2)
      assert.equal(contacts.items.length, 3)
      assert.equal(billingLedgers.items.length, 14)
      assert.equal(billingVouchers.items.length, 6)
      assert.ok(commonModuleSummary.items.length >= 20)
      assert.equal(products.items.length, 3)
      assert.equal(frappeSettings.settings.defaultCompany, "Codexsun Trading Pvt Ltd")
      assert.equal(frappeTodos.todos.items.length, 3)
      assert.equal(frappeItems.manager.items.length, 3)
      assert.equal(frappeReceipts.manager.items.length, 2)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("mailbox archive migration tolerates an existing archived_at column", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-db-mailbox-archive-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      const queryDatabase = runtime.primary as Kysely<DynamicDatabase>

      await queryDatabase.schema
        .createTable(cxappTableNames.mailboxMessages)
        .addColumn("id", "varchar(191)", (column) => column.primaryKey())
        .addColumn("subject", "text", (column) => column.notNull())
        .addColumn("from_email", "varchar(255)", (column) => column.notNull())
        .addColumn("status", "varchar(64)", (column) => column.notNull())
        .addColumn("created_at", "varchar(40)", (column) => column.notNull())
        .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
        .addColumn("archived_at", "varchar(40)")
        .execute()

      await coreMailboxArchiveMigration.up({ database: runtime.primary })
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
