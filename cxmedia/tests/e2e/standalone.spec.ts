import { expect, test } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"

test("standalone cxmedia file browser signs in, uploads, browses, and previews transforms", async ({
  page,
}, testInfo) => {
  const outputDirectory = testInfo.outputPath("fixtures")
  mkdirSync(outputDirectory, { recursive: true })
  const imagePath = `${outputDirectory}/upload.png`
  writeFileSync(
    imagePath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8XQAAAAASUVORK5CYII=",
      "base64"
    )
  )

  await page.goto("/")
  await page.getByLabel("Email").fill("admin@example.com")
  await page.getByLabel("Password").fill("change-me-now")
  await page.getByRole("button", { name: "Sign In" }).click()

  await expect(page.getByRole("heading", { name: "Library", exact: true })).toBeVisible()
  await page.getByLabel("Upload prefix").fill("playwright-check")
  await page.locator('input[type="file"]').setInputFiles(imagePath)

  await expect(page.getByRole("button", { name: "playwright-check", exact: true })).toBeVisible()
  await expect(page.locator(".detail-panel").getByText(/playwright-check\/.*\.png/)).toBeVisible()

  await page.getByRole("button", { name: "playwright-check", exact: true }).click()
  await expect(page.getByRole("heading", { name: "playwright-check" })).toBeVisible()
  await expect(page.locator(".detail-panel").getByText(/playwright-check\/.*\.png/)).toBeVisible()

  const resizeLink = page.getByRole("link", { name: "Resize WebP" })
  await expect(resizeLink).toBeVisible()
  await expect(resizeLink).toHaveAttribute("href", /\/resize\/300x300\/playwright-check\//)
})
