import { expect, test } from "@playwright/test"

test("billing workspace loads after login and exposes voucher/report screens", async ({
  page,
}) => {
  await page.goto("/login?next=/dashboard/billing")

  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1@@")
  await page.getByRole("button", { name: "Login" }).click()

  await expect(page).toHaveURL(/\/dashboard\/billing$/)
  await expect(page.getByText("Accounts Overview")).toBeVisible()
  await expect(page.getByText("Billing Menu")).toBeVisible()

  await page.getByRole("link", { name: /Voucher Register/i }).click()
  await expect(page).toHaveURL(/\/dashboard\/billing\/voucher-register$/)
  await expect(page.getByText("Posted vouchers", { exact: true })).toBeVisible()
  await expect(page.getByText("Post Voucher", { exact: true })).toBeVisible()

  await page.goto("/dashboard/billing/trial-balance")
  await expect(page.getByText("Trial Balance")).toBeVisible()
  await expect(page.getByRole("cell", { name: "Sales Account", exact: true })).toBeVisible()

  await page.goto("/dashboard/billing/bill-outstanding")
  await expect(page.getByText("Bill Outstanding")).toBeVisible()
  await expect(page.getByRole("cell", { name: "SAL-2026-001" })).toBeVisible()
})
