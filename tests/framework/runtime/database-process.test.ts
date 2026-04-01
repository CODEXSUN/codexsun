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
import { listCommonModuleSummaries } from "../../../apps/core/src/services/common-module-service.js"
import { listCompanies } from "../../../apps/core/src/services/company-service.js"
import { listContacts } from "../../../apps/core/src/services/contact-service.js"
import { listCustomerDetails } from "../../../apps/ecommerce/src/services/customer-service.js"
import { listOrderWorkflows } from "../../../apps/ecommerce/src/services/order-service.js"
import { getStorefrontCatalog, listProducts } from "../../../apps/ecommerce/src/services/product-service.js"
import { getEcommercePricingSettings } from "../../../apps/ecommerce/src/services/settings-service.js"
import { listFrappeItems } from "../../../apps/frappe/src/services/item-service.js"
import { listFrappePurchaseReceipts } from "../../../apps/frappe/src/services/purchase-receipt-service.js"
import { readFrappeSettings } from "../../../apps/frappe/src/services/settings-service.js"
import { listFrappeTodos } from "../../../apps/frappe/src/services/todo-service.js"
import { ecommerceTableNames } from "../../../apps/ecommerce/database/table-names.js"
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
      "core:bootstrap:01-bootstrap",
      "core:companies:02-companies",
      "core:contacts:03-contacts",
      "core:common-modules:04-common-modules",
      "core:auth:05-auth-foundation",
      "core:auth:06-auth-sessions",
      "core:mailbox:07-mailbox",
      "core:common-modules:08-common-module-tables",
      "ecommerce:pricing-settings:01-pricing-settings",
      "ecommerce:products:02-products",
      "ecommerce:storefront:03-storefront",
      "ecommerce:orders:04-orders",
      "ecommerce:customers:05-customers",
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
      "core:bootstrap:01-bootstrap",
      "core:companies:02-companies",
      "core:contacts:03-contacts",
      "core:common-modules:04-common-modules",
      "core:auth:05-auth-foundation",
      "core:mailbox:06-mailbox",
      "core:common-modules:07-common-module-tables",
      "ecommerce:pricing-settings:01-pricing-settings",
      "ecommerce:products:02-products",
      "ecommerce:storefront:03-storefront",
      "ecommerce:orders:04-orders",
      "ecommerce:customers:05-customers",
      "frappe:settings:01-settings",
      "frappe:todos:02-todos",
      "frappe:items:03-items",
      "frappe:purchase-receipts:04-purchase-receipts",
      "frappe:item-sync-logs:05-item-product-sync-logs",
    ]
  )
})

test("database prepare applies app-owned migrations and seeders for core, ecommerce, and frappe", async () => {
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
        .selectFrom(coreTableNames.companies)
        .select(["id"])
        .execute()
      const commonCategoryRows = await queryDatabase
        .selectFrom(commonModuleTableNames.productCategories)
        .select(["id"])
        .execute()
      const productRows = await queryDatabase
        .selectFrom(ecommerceTableNames.products)
        .select(["id"])
        .execute()
      const seededSuperAdmin = await queryDatabase
        .selectFrom(coreTableNames.authUsers)
        .select(["email", "is_super_admin"])
        .where("id", "=", "auth-user:platform-admin")
        .executeTakeFirst()

      assert.equal(
        appliedMigrations.length,
        listRegisteredDatabaseMigrations().length
      )
      assert.equal(appliedSeeders.length, listRegisteredDatabaseSeeders().length)
      assert.equal(companyRows.length, 2)
      assert.equal(commonCategoryRows.length, 3)
      assert.equal(productRows.length, 3)
      assert.equal(seededSuperAdmin?.email, "sundar@sundar.com")
      assert.equal(Number(seededSuperAdmin?.is_super_admin ?? 0), 1)

      const companies = await listCompanies(runtime.primary)
      const contacts = await listContacts(runtime.primary)
      const commonModuleSummary = await listCommonModuleSummaries(runtime.primary)
      const products = await listProducts(runtime.primary)
      const storefrontCatalog = await getStorefrontCatalog(runtime.primary)
      const orderWorkflows = await listOrderWorkflows(runtime.primary)
      const customerDetails = await listCustomerDetails(runtime.primary)
      const pricingSettings = await getEcommercePricingSettings(runtime.primary)
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
      const frappeSettings = await readFrappeSettings(runtime.primary, adminUser)
      const frappeTodos = await listFrappeTodos(runtime.primary, adminUser)
      const frappeItems = await listFrappeItems(runtime.primary, adminUser)
      const frappeReceipts = await listFrappePurchaseReceipts(runtime.primary, adminUser)

      assert.equal(companies.items.length, 2)
      assert.equal(contacts.items.length, 3)
      assert.ok(commonModuleSummary.items.length >= 20)
      assert.equal(products.items.length, 3)
      assert.equal(storefrontCatalog.products.length, 3)
      assert.equal(orderWorkflows.items.length, 2)
      assert.equal(customerDetails.items.length, 2)
      assert.equal(pricingSettings.settings.purchaseToSellPercent, 22)
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
