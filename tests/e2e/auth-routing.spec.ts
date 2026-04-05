import { expect, test } from "@playwright/test"

async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Login" }).click()
}

test("admin login lands on the admin dashboard", async ({ page }) => {
  await login(page, "sundar@sundar.com", "Kalarani1@@")

  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await expect(page.getByText("Signed in as Sundar (admin)")).toBeVisible()
  await expect(page.getByText("Admin", { exact: true })).toBeVisible()
})

test("operator login lands on the user dashboard and cannot stay on admin routes", async ({
  page,
}) => {
  await login(page, "operator@codexsun.local", "Operator@12345")

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByText("Signed in as Workspace Operator (staff)")
  ).toBeVisible()
  await expect(page.getByText("Framework", { exact: true })).toBeVisible()

  await page.goto("/admin/dashboard")
  await expect(page).toHaveURL(/\/dashboard$/)
})

test("customer login lands on the customer portal and cannot stay on desk routes", async ({
  page,
}) => {
  await login(page, "customer@codexsun.local", "Customer@12345")

  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByText("Customer portal", { exact: true })).toBeVisible()

  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/profile$/)
})
