import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  getDemoInstallJob,
  getDemoSummary,
  installDemoProfile,
  startDemoInstallJob,
} from "../../apps/demo/src/services/demo-data-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

test("demo installer swaps between default and richer demo datasets", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-demo-services-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const initialSummary = await getDemoSummary(runtime.primary)
      const initialCompanies = initialSummary.modules.find((module) => module.id === "companies")
      const initialCategories = initialSummary.modules.find((module) => module.id === "categories")
      const initialCustomers = initialSummary.modules.find((module) => module.id === "customers")
      const initialOrders = initialSummary.modules.find((module) => module.id === "orders")

      assert.ok(initialCompanies)
      assert.ok(initialCategories)
      assert.ok(initialCustomers)
      assert.ok(initialOrders)
      assert.equal(initialCustomers.currentCount, 0)
      assert.equal(initialOrders.currentCount, 0)

      const installedDemo = await installDemoProfile(runtime.primary, { profileId: "demo" })
      const demoCompanies = installedDemo.summary.modules.find((module) => module.id === "companies")
      const demoCategories = installedDemo.summary.modules.find((module) => module.id === "categories")
      const demoCustomers = installedDemo.summary.modules.find((module) => module.id === "customers")
      const demoOrders = installedDemo.summary.modules.find((module) => module.id === "orders")

      assert.ok(demoCompanies)
      assert.ok(demoCategories)
      assert.ok(demoCustomers)
      assert.ok(demoOrders)
      assert.equal(demoCompanies.currentCount, demoCompanies.demoCount)
      assert.equal(demoCategories.currentCount, demoCategories.demoCount)
      assert.equal(demoCustomers.currentCount, demoCustomers.demoCount)
      assert.equal(demoOrders.currentCount, demoOrders.demoCount)
      assert.equal(demoCustomers.currentCount > 0, true)
      assert.equal(demoOrders.currentCount > 0, true)

      const installedDefault = await installDemoProfile(runtime.primary, { profileId: "default" })
      const defaultCompanies = installedDefault.summary.modules.find((module) => module.id === "companies")
      const defaultCategories = installedDefault.summary.modules.find((module) => module.id === "categories")
      const defaultCustomers = installedDefault.summary.modules.find((module) => module.id === "customers")
      const defaultOrders = installedDefault.summary.modules.find((module) => module.id === "orders")

      assert.ok(defaultCompanies)
      assert.ok(defaultCategories)
      assert.ok(defaultCustomers)
      assert.ok(defaultOrders)
      assert.equal(defaultCompanies.currentCount, defaultCompanies.defaultCount)
      assert.equal(defaultCategories.currentCount, defaultCategories.defaultCount)
      assert.equal(defaultCustomers.currentCount, 0)
      assert.equal(defaultOrders.currentCount, 0)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("demo installer supports split contact, customer, product, and category jobs", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-demo-job-services-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const customerContactsJob = await startDemoInstallJob(runtime.primary, {
        target: "contacts",
        variant: "customer",
        count: 2,
      })
      const productJob = await startDemoInstallJob(runtime.primary, {
        target: "products",
        variant: "catalog",
        count: 2,
      })
      const categoryJob = await startDemoInstallJob(runtime.primary, {
        target: "categories",
        variant: "storefront",
        count: 2,
      })
      const customersJob = await startDemoInstallJob(runtime.primary, {
        target: "customers",
        variant: "portal",
        count: 2,
      })

      async function waitForJob(jobId: string) {
        for (let attempt = 0; attempt < 50; attempt += 1) {
          const response = await getDemoInstallJob(jobId)

          if (response.item.status === "completed") {
            return response.item
          }

          if (response.item.status === "failed") {
            throw new Error(response.item.message)
          }

          await new Promise((resolve) => setTimeout(resolve, 50))
        }

        throw new Error(`Timed out waiting for job ${jobId}.`)
      }

      const finalJobs = await Promise.all([
        waitForJob(customerContactsJob.item.id),
        waitForJob(productJob.item.id),
        waitForJob(categoryJob.item.id),
        waitForJob(customersJob.item.id),
      ])

      for (const job of finalJobs) {
        assert.equal(job.status, "completed")
        assert.equal(job.percent, 100)
      }

      const summary = await getDemoSummary(runtime.primary)
      const contacts = summary.modules.find((module) => module.id === "contacts")
      const products = summary.modules.find((module) => module.id === "products")
      const categories = summary.modules.find((module) => module.id === "categories")
      const customers = summary.modules.find((module) => module.id === "customers")

      assert.ok(contacts)
      assert.ok(products)
      assert.ok(categories)
      assert.ok(customers)
      assert.equal(contacts.currentCount >= 2, true)
      assert.equal(products.currentCount >= 2, true)
      assert.equal(categories.currentCount >= 2, true)
      assert.equal(customers.currentCount >= 2, true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
