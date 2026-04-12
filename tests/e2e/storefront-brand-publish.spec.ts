import { expect, test, type Page } from "@playwright/test"

async function loginAsAdmin(page: Page, nextPath: string) {
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`)
  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1@@")
  await page.getByRole("button", { name: "Login" }).click()
}

async function openLogoDesigner(page: Page) {
  await page.getByRole("button", { name: "Logos", exact: true }).click()
  await expect(page.getByText("Logo Designer", { exact: true })).toBeVisible()
}

async function configureBrandVariant(
  page: Page,
  variantLabel: "Light" | "Dark" | "Favicon",
  fillColor: string
) {
  await page.getByRole("button", { name: variantLabel, exact: true }).click()

  const sourceInput = page.getByPlaceholder("Paste image URL or choose from media")
  await sourceInput.fill("/logo.svg")

  await page.getByRole("button", { name: "Uniform", exact: true }).click()

  const colorInputs = page.locator('input[type="color"]')
  await colorInputs.first().fill(fillColor)
}

test("publishing company brand assets updates storefront runtime logo surfaces", async ({
  page,
}) => {
  await loginAsAdmin(page, "/dashboard/settings/companies/company:codexsun/edit")

  await expect(page).toHaveURL(/\/dashboard\/settings\/companies\/company:codexsun\/edit$/)
  await expect(page.getByRole("heading", { name: "Update Company" })).toBeVisible()

  const previousBrandProfile = await page.evaluate(async () =>
    fetch("/public/v1/brand-profile").then(async (response) => response.json())
  )

  await openLogoDesigner(page)
  await configureBrandVariant(page, "Light", "#123456")
  await configureBrandVariant(page, "Dark", "#abcdef")
  await configureBrandVariant(page, "Favicon", "#4a7c59")

  await page.getByRole("button", { name: "Publish To Public" }).click()
  await page.waitForTimeout(1500)
  await page.waitForLoadState("networkidle")

  await page.goto("/")
  await expect(page.locator('[data-technical-name="shell.storefront.top-menu"]')).toBeVisible()

  const topMenuLogo = page.locator('[data-technical-name="shell.storefront.top-menu"] img').first()
  await expect(topMenuLogo).toHaveAttribute("src", /\/logo\.svg\?v=/)

  const footer = page.locator('[data-technical-name="section.storefront.footer"]').first()
  await footer.scrollIntoViewIfNeeded()
  await expect(footer).toBeVisible()

  const footerLogo = footer.locator("img").first()
  await expect(footerLogo).toHaveAttribute("src", /\/logo-dark\.svg\?v=/)

  const brandingState = await page.evaluate(async () => {
    const brandProfile = await fetch("/public/v1/brand-profile").then(async (response) =>
      response.json()
    )

    const [primaryAsset, darkAsset, faviconAsset] = await Promise.all([
      fetch("/public/v1/brand-logo", { cache: "no-store" }),
      fetch("/public/v1/brand-logo-dark", { cache: "no-store" }),
      fetch("/public/v1/brand-favicon", { cache: "no-store" }),
    ])

    const faviconHref =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.getAttribute("href") ?? null

    return {
      brandProfile,
      faviconHref,
      primaryContentType: primaryAsset.headers.get("content-type"),
      primaryOk: primaryAsset.ok,
      darkContentType: darkAsset.headers.get("content-type"),
      darkOk: darkAsset.ok,
      faviconContentType: faviconAsset.headers.get("content-type"),
      faviconOk: faviconAsset.ok,
    }
  })

  expect(String(previousBrandProfile?.item?.logoUrl ?? "")).not.toBe(
    String(brandingState.brandProfile?.item?.logoUrl ?? "")
  )
  expect(String(previousBrandProfile?.item?.darkLogoUrl ?? "")).not.toBe(
    String(brandingState.brandProfile?.item?.darkLogoUrl ?? "")
  )
  expect(String(brandingState.brandProfile?.item?.logoUrl ?? "")).toMatch(/\/logo\.svg\?v=/)
  expect(String(brandingState.brandProfile?.item?.darkLogoUrl ?? "")).toMatch(/\/logo-dark\.svg\?v=/)
  expect(brandingState.faviconHref).toBe("/favicon.svg")
  expect(brandingState.primaryOk).toBe(true)
  expect(brandingState.darkOk).toBe(true)
  expect(brandingState.faviconOk).toBe(true)
  expect(String(brandingState.primaryContentType ?? "")).toContain("image/svg+xml")
  expect(String(brandingState.darkContentType ?? "")).toContain("image/svg+xml")
  expect(String(brandingState.faviconContentType ?? "")).toContain("image/svg+xml")
})
