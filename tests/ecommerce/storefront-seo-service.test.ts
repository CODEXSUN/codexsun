import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getStorefrontRobotsTxt, getStorefrontSitemapXml } from "../../apps/ecommerce/src/services/storefront-seo-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

test("storefront seo service builds robots and sitemap from runtime config and seeded catalog", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-storefront-seo-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.frontendDomain = "store.example.com"
    config.frontendTarget = "shop"
    config.tlsEnabled = true
    config.cloudflareEnabled = false
    config.frontendHttpsPort = 443

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const robots = getStorefrontRobotsTxt(config)
      const sitemap = await getStorefrontSitemapXml(runtime.primary, config)

      assert.match(robots, /Sitemap: https:\/\/store\.example\.com\/sitemap\.xml/)
      assert.match(robots, /Disallow: \/checkout/)
      assert.match(sitemap, /<loc>https:\/\/store\.example\.com\/<\/loc>/)
      assert.match(sitemap, /<loc>https:\/\/store\.example\.com\/catalog<\/loc>/)
      assert.match(sitemap, /<loc>https:\/\/store\.example\.com\/privacy<\/loc>/)
      assert.match(sitemap, /<loc>https:\/\/store\.example\.com\/products\//)
    } finally {
      await runtime.primary.destroy()
      if (runtime.analytics) {
        await runtime.analytics.destroy()
      }
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
