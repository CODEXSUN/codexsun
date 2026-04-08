import type { Page } from "@playwright/test"

export type StorefrontPerformanceSnapshot = {
  cls: number
  lcp: number | null
  domContentLoaded: number
  load: number
  resourceCount: number
}

export async function installStorefrontPerformanceObserver(page: Page) {
  await page.addInitScript(() => {
    const metrics = {
      cls: 0,
      lcp: 0,
    }

    const globalWindow = window as Window & {
      __codexsunStorefrontPerformance?: typeof metrics
    }

    globalWindow.__codexsunStorefrontPerformance = metrics

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { value?: number }>) {
          if ((entry as { hadRecentInput?: boolean }).hadRecentInput) {
            continue
          }

          metrics.cls += entry.value ?? 0
        }
      }).observe({ type: "layout-shift", buffered: true })
    } catch {
      // Ignore unsupported observers in test browsers.
    }

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          metrics.lcp = lastEntry.startTime
        }
      }).observe({ type: "largest-contentful-paint", buffered: true })
    } catch {
      // Ignore unsupported observers in test browsers.
    }
  })
}

export async function captureStorefrontPerformance(page: Page) {
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1_000)

  return page.evaluate(() => {
    const globalWindow = window as Window & {
      __codexsunStorefrontPerformance?: {
        cls: number
        lcp: number
      }
    }
    const navigationEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined
    const resources = performance.getEntriesByType("resource")
    const observed = globalWindow.__codexsunStorefrontPerformance

    return {
      cls: observed?.cls ?? 0,
      lcp: observed?.lcp ? Math.round(observed.lcp) : null,
      domContentLoaded: navigationEntry
        ? Math.round(navigationEntry.domContentLoadedEventEnd)
        : 0,
      load: navigationEntry ? Math.round(navigationEntry.loadEventEnd) : 0,
      resourceCount: resources.length,
    } satisfies StorefrontPerformanceSnapshot
  })
}
