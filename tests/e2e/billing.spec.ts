import { expect, test } from "@playwright/test"

test("billing workspace loads after login and exposes voucher/report screens", async ({
  page,
}) => {
  await page.goto("/login?next=/dashboard/billing")

  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1@@")
  await page.getByRole("button", { name: "Login" }).click()

  await expect(page).toHaveURL(/\/dashboard\/billing$/)
  await expect(page.getByText("Billing Menu", { exact: true })).toBeVisible()

  await page.locator('[data-slot="sidebar"]').getByRole("link", { name: "Voucher Register", exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard\/billing\/voucher-register$/)
  await expect(page.getByRole("button", { name: "New Voucher" })).toBeVisible()
  await expect(page.getByPlaceholder("Search vouchers")).toBeVisible()

  await page.goto("/dashboard/billing/trial-balance")
  await expect(page.getByRole("heading", { name: "Trial Balance" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "Sales Account", exact: true })).toBeVisible()

  await page.goto("/dashboard/billing/bill-outstanding")
  await expect(page.getByRole("heading", { name: "Bill Outstanding" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "SAL-2026-001" })).toBeVisible()
})

test("billing ledger master updates from popup without invalid payload errors", async ({
  page,
}) => {
  await page.goto("/login?next=/dashboard/billing/chart-of-accounts")

  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1@@")
  await page.getByRole("button", { name: "Login" }).click()

  await expect(page).toHaveURL(/\/dashboard\/billing\/chart-of-accounts$/)
  await expect(page.getByRole("button", { name: "New Ledger" })).toBeVisible()

  await page.getByRole("cell", { name: "Cash-in-Hand", exact: true }).waitFor()
  await page.getByRole("button", { name: "Open ledger actions" }).first().click()
  await page.getByRole("menuitem", { name: "Edit" }).click()

  await expect(page.getByRole("heading", { name: "Update ledger master" })).toBeVisible()
  const updateResponse = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes("/internal/v1/billing/ledger?")
    ),
    page.getByRole("button", { name: "Update ledger" }).click(),
  ]).then(([response]) => response)

  expect(updateResponse.status()).toBe(200)
  await expect(page.getByText("Invalid request payload.")).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Update ledger master" })).toHaveCount(0)
  await expect(page.getByRole("cell", { name: "Cash-in-Hand", exact: true })).toBeVisible()
})
