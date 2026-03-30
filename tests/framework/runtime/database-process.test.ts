import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import type { Kysely } from "kysely"

import { coreTableNames } from "../../../apps/core/database/table-names.js"
import { listCommonModuleSummaries } from "../../../apps/core/src/services/common-module-service.js"
import { listCompanies } from "../../../apps/core/src/services/company-service.js"
import { listContacts } from "../../../apps/core/src/services/contact-service.js"
import { listCustomerDetails } from "../../../apps/ecommerce/src/services/customer-service.js"
import { listOrderWorkflows } from "../../../apps/ecommerce/src/services/order-service.js"
import { getStorefrontCatalog, listProducts } from "../../../apps/ecommerce/src/services/product-service.js"
import { getEcommercePricingSettings } from "../../../apps/ecommerce/src/services/settings-service.js"
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
      "ecommerce:pricing-settings:01-pricing-settings",
      "ecommerce:products:02-products",
      "ecommerce:storefront:03-storefront",
      "ecommerce:orders:04-orders",
      "ecommerce:customers:05-customers",
    ]
  )

  assert.deepEqual(
    listRegisteredDatabaseSeeders().map((seeder) => seeder.id),
    [
      "core:bootstrap:01-bootstrap",
      "core:companies:02-companies",
      "core:contacts:03-contacts",
      "core:common-modules:04-common-modules",
      "ecommerce:pricing-settings:01-pricing-settings",
      "ecommerce:products:02-products",
      "ecommerce:storefront:03-storefront",
      "ecommerce:orders:04-orders",
      "ecommerce:customers:05-customers",
    ]
  )
})

test("database prepare applies app-owned migrations and seeders for core and ecommerce", async () => {
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
      const productRows = await queryDatabase
        .selectFrom(ecommerceTableNames.products)
        .select(["id"])
        .execute()

      assert.equal(
        appliedMigrations.length,
        listRegisteredDatabaseMigrations().length
      )
      assert.equal(appliedSeeders.length, listRegisteredDatabaseSeeders().length)
      assert.equal(companyRows.length, 2)
      assert.equal(productRows.length, 3)

      const companies = await listCompanies(runtime.primary)
      const contacts = await listContacts(runtime.primary)
      const commonModuleSummary = await listCommonModuleSummaries(runtime.primary)
      const products = await listProducts(runtime.primary)
      const storefrontCatalog = await getStorefrontCatalog(runtime.primary)
      const orderWorkflows = await listOrderWorkflows(runtime.primary)
      const customerDetails = await listCustomerDetails(runtime.primary)
      const pricingSettings = await getEcommercePricingSettings(runtime.primary)

      assert.equal(companies.items.length, 2)
      assert.equal(contacts.items.length, 3)
      assert.ok(commonModuleSummary.items.length >= 20)
      assert.equal(products.items.length, 3)
      assert.equal(storefrontCatalog.products.length, 3)
      assert.equal(orderWorkflows.items.length, 2)
      assert.equal(customerDetails.items.length, 2)
      assert.equal(pricingSettings.settings.purchaseToSellPercent, 22)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
