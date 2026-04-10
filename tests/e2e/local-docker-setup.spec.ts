import { expect, test } from "@playwright/test"

test("docker local codexsun setup serves the storefront and shared login", async ({
  page,
}) => {
  await page.goto("/")

  await expect(page).toHaveTitle(/Codexsun/i)
  await expect(page.locator("body")).toContainText("Aster Linen Shirt")
  await expect(page.locator("body")).toContainText("Featured edit")

  await page.goto("/login")
  await expect(page).toHaveTitle(/Codexsun/i)
  await expect(page.locator("body")).toContainText(
    "Use one sign in for customer, staff, and admin access."
  )
  await expect(page.getByLabel("Email")).toBeVisible()
  await expect(page.getByLabel("Password")).toBeVisible()
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible()
})
