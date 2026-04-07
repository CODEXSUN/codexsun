import { expect, test } from "@playwright/test"

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1@@")
  await page.getByRole("button", { name: "Login" }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
}

test("framework operations pages load from the admin shell", async ({ page }) => {
  await login(page)

  await page.goto("/dashboard/settings/data-backup")
  await expect(page.locator("main").getByRole("heading", { name: "Data Backup" }).last()).toBeVisible()
  await expect(page.getByRole("button", { name: "Run Backup" })).toBeVisible()
  await expect(page.getByText("Data Backup", { exact: true }).first()).toBeVisible()
  await page.getByRole("button", { name: "Automation" }).click()
  await expect(page.getByRole("switch", { name: "Scheduled Backups" })).toBeVisible()

  await page.goto("/dashboard/settings/security-review")
  await expect(page.locator("main").getByRole("heading", { name: "Security Review" }).last()).toBeVisible()
  await expect(page.getByText("Checklist posture")).toBeVisible()
  await page.getByRole("button", { name: "History" }).click()
  await expect(page.getByText("Review History")).toBeVisible()
})
