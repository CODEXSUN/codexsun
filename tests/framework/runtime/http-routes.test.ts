import assert from "node:assert/strict"
import test from "node:test"

import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"
import {
  createHttpRouteAssemblies,
  matchHttpRoute,
} from "../../../apps/framework/src/runtime/http/index.js"

test("http route assemblies expose versioned internal, external, and public surfaces with legacy compatibility", () => {
  const routes = createHttpRouteAssemblies(createAppSuite())

  const internalApps = routes.find((route) => route.path === "/internal/v1/apps")
  const externalApps = routes.find((route) => route.path === "/api/v1/apps")
  const razorpayWebhook = routes.find(
    (route) => route.path === "/api/v1/storefront/payments/razorpay/webhook"
  )
  const publicBootstrap = routes.find(
    (route) => route.path === "/public/v1/bootstrap"
  )
  const publicLegalPage = routes.find(
    (route) => route.path === "/public/v1/storefront/legal-page"
  )
  const publicRobots = routes.find(
    (route) => route.path === "/public/v1/storefront/robots.txt"
  )
  const publicSitemap = routes.find(
    (route) => route.path === "/public/v1/storefront/sitemap.xml"
  )

  assert.ok(internalApps)
  assert.equal(internalApps.surface, "internal")
  assert.equal(internalApps.auth, "internal")
  assert.deepEqual(internalApps.legacyPaths, ["/internal/apps"])

  assert.ok(externalApps)
  assert.equal(externalApps.surface, "external")
  assert.equal(externalApps.auth, "external")
  assert.deepEqual(externalApps.legacyPaths, ["/api/apps"])

  assert.ok(razorpayWebhook)
  assert.equal(razorpayWebhook.surface, "external")
  assert.equal(razorpayWebhook.auth, "none")

  assert.ok(publicBootstrap)
  assert.equal(publicBootstrap.surface, "public")
  assert.equal(publicBootstrap.auth, "none")

  assert.ok(publicLegalPage)
  assert.equal(publicLegalPage.surface, "public")
  assert.equal(publicLegalPage.auth, "none")

  assert.ok(publicRobots)
  assert.equal(publicRobots.surface, "public")
  assert.equal(publicRobots.auth, "none")
  assert.deepEqual(publicRobots.legacyPaths, ["/robots.txt"])

  assert.ok(publicSitemap)
  assert.equal(publicSitemap.surface, "public")
  assert.equal(publicSitemap.auth, "none")
  assert.deepEqual(publicSitemap.legacyPaths, ["/sitemap.xml"])

  assert.equal(
    matchHttpRoute(routes, "GET", "/internal/apps")?.path,
    "/internal/v1/apps"
  )
  assert.equal(
    matchHttpRoute(routes, "GET", "/api/apps")?.path,
    "/api/v1/apps"
  )
  assert.equal(
    matchHttpRoute(routes, "GET", "/robots.txt")?.path,
    "/public/v1/storefront/robots.txt"
  )
  assert.equal(
    matchHttpRoute(routes, "GET", "/sitemap.xml")?.path,
    "/public/v1/storefront/sitemap.xml"
  )
})
