import { writeFileSync } from "node:fs"

import { expect, test, type Page } from "@playwright/test"

async function loginAsAdmin(page: Page, nextPath: string) {
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`)
  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1@@")
  await page.getByRole("button", { name: "Login" }).click()
}

function createTempSvgPath(testOutputPath: string) {
  const svgPath = `${testOutputPath}-upload-logo.svg`

  writeFileSync(
    svgPath,
    [
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120">',
      '<rect width="320" height="120" rx="24" fill="#f5f1eb" />',
      '<text x="28" y="74" font-size="44" fill="#123456">Upload Logo</text>',
      "</svg>",
    ].join(""),
    "utf8"
  )

  return svgPath
}

test("company logo designer accepts uploaded svg media before publish", async ({
  page,
}, testInfo) => {
  const uploadedSvgPath = createTempSvgPath(testInfo.outputPath("company-logo"))

  await loginAsAdmin(page, "/dashboard/settings/companies/company:codexsun/edit")

  await expect(page).toHaveURL(/\/dashboard\/settings\/companies\/company:codexsun\/edit$/)
  await page.getByRole("button", { name: "Logos", exact: true }).click()
  await expect(page.getByText("Logo Designer", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Light", exact: true }).click()
  await page.getByRole("button", { name: "Media", exact: true }).click()
  await expect(page.getByText("Select Media", { exact: true })).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles(uploadedSvgPath)

  await expect(page.getByText("Uploading:", { exact: false })).toBeVisible()
  await expect(page.getByText("Uploading:", { exact: false })).toBeHidden({ timeout: 20_000 })
  await expect(page.getByText("Failed to upload media.")).toHaveCount(0)
  await expect(page.getByText("Select Media", { exact: true })).toBeHidden({ timeout: 10_000 })

  const sourceInput = page.getByPlaceholder("Paste image URL or choose from media").first()
  await expect(sourceInput).toHaveValue(/\/storage\/.+\.svg$/)

  await page.getByRole("button", { name: "Publish To Public" }).click()
  await page.waitForTimeout(1500)
  await page.waitForLoadState("networkidle")
  await page.goto("/")
  await expect(page.locator('[data-technical-name="shell.storefront.top-menu"] img').first()).toHaveAttribute(
    "src",
    /\/logo\.svg\?v=/
  )
})
