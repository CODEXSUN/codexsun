import { expect, test, type Page } from "@playwright/test"

async function loginAsEcommerceAdmin(nextPath: string, page: Page) {
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`)

  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1@@")
  await page.getByRole("button", { name: "Login" }).click()
}

test("ecommerce admin operations workspace covers content, orders, payments, and support", async ({
  page,
}) => {
  await loginAsEcommerceAdmin("/dashboard/apps/ecommerce/storefront", page)

  await expect(page).toHaveURL(/\/dashboard\/apps\/ecommerce\/storefront$/)
  await expect(page.getByRole("button", { name: "Save storefront" })).toBeVisible()
  await expect(page.getByText("Draft matches live").or(page.getByText("Draft ahead of live"))).toBeVisible()
  await expect(page.getByText("Settings version history")).toBeVisible()

  await page.goto("/dashboard/apps/ecommerce/orders")
  await expect(page.getByText("Ecommerce admin order queue")).toBeVisible()
  await expect(page.getByLabel("Search ecommerce order queue")).toBeVisible()
  await expect(page.getByRole("button", { name: /Action required \(\d+\)/ })).toBeVisible()

  await page.goto("/dashboard/apps/ecommerce/payments")
  await expect(page.getByText("Settlement visibility and payment exceptions")).toBeVisible()
  await expect(page.getByRole("button", { name: "Export daily summary" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Run reconciliation" })).toBeVisible()

  await page.goto("/dashboard/apps/ecommerce/support")
  await expect(page.getByText("Support queue linked to storefront orders")).toBeVisible()
  await expect(page.getByPlaceholder("Search case, customer, subject, or order")).toBeVisible()
  await expect(page.getByText("Select a support case")).toBeVisible()
})
