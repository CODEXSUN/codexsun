import { expect, test, type Page } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"

async function loginAsAdmin(page: Page) {
  await page.goto("/login?next=/dashboard/media")
  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1@@")
  await page.getByRole("button", { name: "Login" }).click()
}

test("framework media manager uploads and browses media through the live cxmedia bridge", async ({ page }, testInfo) => {
  const outputDirectory = testInfo.outputPath("fixtures")
  mkdirSync(outputDirectory, { recursive: true })
  const fileStem = `bridge-upload-${Date.now()}`
  const fileName = `${fileStem}.png`
  const imagePath = `${outputDirectory}/${fileName}`

  writeFileSync(
    imagePath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8XQAAAAASUVORK5CYII=",
      "base64"
    )
  )

  await loginAsAdmin(page)

  await expect(page).toHaveURL(/\/dashboard\/media$/)
  await expect(page.locator("main").getByRole("heading", { name: "Media Manager" }).nth(0)).toBeVisible()
  await expect(
    page.getByText("Framework media storage is handled by cxmedia.")
  ).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles(imagePath)
  await expect(page.getByText("Uploading:", { exact: false })).toBeVisible()
  await expect(page.getByText("Uploading:", { exact: false })).toBeHidden({ timeout: 20_000 })
  await expect(page.getByText("Failed to upload media.")).toHaveCount(0)

  await page.getByRole("button", { name: "Browse", exact: true }).click()
  const searchInput = page.getByLabel("Search")
  await searchInput.fill(fileStem)

  const assetTitle = page.getByText(fileStem, { exact: true }).first()
  await expect(assetTitle).toBeVisible()

  const previewImage = page.locator(`img[alt="${fileStem}"]`).first()
  await expect(previewImage).toBeVisible()

  const previewSource = await previewImage.getAttribute("src")
  expect(previewSource).toMatch(/\/public\/v1\/framework\/media-file\?id=/)

  const mediaResponse = await page.request.get(previewSource!)
  expect(mediaResponse.ok()).toBeTruthy()
  expect(mediaResponse.headers()["content-type"]).toContain("image/")
  expect((await mediaResponse.body()).byteLength).toBeGreaterThan(0)
})
