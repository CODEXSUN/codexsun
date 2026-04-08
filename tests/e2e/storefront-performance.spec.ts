import { expect, test } from "@playwright/test"

import {
  captureStorefrontPerformance,
  installStorefrontPerformanceObserver,
  type StorefrontPerformanceSnapshot,
} from "./helpers/storefront-performance"

type RouteBudget = {
  path: string
  name: string
  lcpMax: number
  clsMax: number
  domContentLoadedMax: number
  loadMax: number
  resourceCountMax: number
}

const routeBudgets: RouteBudget[] = [
  {
    path: "/",
    name: "home",
    lcpMax: 3500,
    clsMax: 0.35,
    domContentLoadedMax: 2000,
    loadMax: 5000,
    resourceCountMax: 120,
  },
  {
    path: "/catalog",
    name: "catalog",
    lcpMax: 3500,
    clsMax: 0.1,
    domContentLoadedMax: 2500,
    loadMax: 5500,
    resourceCountMax: 160,
  },
  {
    path: "/products/aster-linen-shirt",
    name: "product",
    lcpMax: 3500,
    clsMax: 0.1,
    domContentLoadedMax: 2500,
    loadMax: 5500,
    resourceCountMax: 160,
  },
]

function assertBudget(snapshot: StorefrontPerformanceSnapshot, budget: RouteBudget) {
  expect(snapshot.lcp, `${budget.name} LCP should be captured`).not.toBeNull()
  expect(snapshot.lcp ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(budget.lcpMax)
  expect(snapshot.cls).toBeLessThanOrEqual(budget.clsMax)
  expect(snapshot.domContentLoaded).toBeLessThanOrEqual(budget.domContentLoadedMax)
  expect(snapshot.load).toBeLessThanOrEqual(budget.loadMax)
  expect(snapshot.resourceCount).toBeLessThanOrEqual(budget.resourceCountMax)
}

for (const budget of routeBudgets) {
  test(`storefront performance budget holds for ${budget.name}`, async ({ page }) => {
    await installStorefrontPerformanceObserver(page)
    await page.goto(budget.path)

    const snapshot = await captureStorefrontPerformance(page)

    test.info().annotations.push({
      type: "performance",
      description: JSON.stringify({
        route: budget.path,
        ...snapshot,
      }),
    })

    assertBudget(snapshot, budget)
  })
}
