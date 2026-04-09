import { expect, test, type Page } from "@playwright/test"

const DEVTOOLS_NAMES_STORAGE_KEY = "codexsun.ui.developer-tools.show-technical-names"

async function loginAsAdmin(page: Page, nextPath: string) {
  await page.goto("/")
  await page.evaluate(
    ([storageKey]) => {
      window.localStorage.clear()
      window.sessionStorage.clear()
      window.localStorage.setItem(storageKey, "true")
    },
    [DEVTOOLS_NAMES_STORAGE_KEY]
  )
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`)
  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1@@")
  await page.getByRole("button", { name: "Login" }).click()
}

test("developer technical-name badges are visible on ecommerce product list", async ({
  page,
}) => {
  await loginAsAdmin(page, "/dashboard/apps/ecommerce/products")

  await expect(page).toHaveURL(/\/dashboard\/apps\/ecommerce\/products$/)
  await expect(page.getByText("section.core.products.filters").first()).toBeVisible()
  await expect(page.getByText("page.core.products").first()).toBeVisible()
  await expect(page.getByText("section.core.products.table").first()).toBeVisible()
})
