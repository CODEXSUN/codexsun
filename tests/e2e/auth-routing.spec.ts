import { expect, test } from "@playwright/test"

async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  path = "/login"
) {
  await page.goto(path)
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Login" }).click()
}

test("legacy storefront login routes redirect into the shared login page", async ({
  page,
}) => {
  await page.goto("/customer/login")

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByText(
      "Use one sign in for customer, staff, and admin access. Your role decides the destination automatically."
    )
  ).toBeVisible()
})

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

test("customer login uses the shared login page, opens the portal, and restores on reload", async ({
  page,
}) => {
  await page.goto("/customer")

  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel("Email").fill("customer@codexsun.local")
  await page.getByLabel("Password").fill("Customer@12345")
  await page.getByRole("button", { name: "Login" }).click()

  await expect(page).toHaveURL(/\/customer$/)
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible()

  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/customer$/)

  await page.reload()
  await expect(page).toHaveURL(/\/customer$/)
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible()
})
