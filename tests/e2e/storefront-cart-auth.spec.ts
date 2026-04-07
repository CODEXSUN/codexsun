import { expect, test } from "@playwright/test"

async function seedCart(page: import("@playwright/test").Page) {
  await page.goto("/cart")
  await page.evaluate(() => {
    window.localStorage.setItem(
      "codexsun.storefront.cart",
      JSON.stringify([
        {
          productId: "core-product:aster-linen-shirt",
          slug: "aster-linen-shirt",
          name: "Aster Linen Shirt",
          imageUrl: null,
          quantity: 1,
          unitPrice: 1890,
          mrp: 2230,
        },
      ])
    )
  })
  await page.reload()
}

test("cart checkout prompts unauthenticated customers to sign in and returns to checkout", async ({
  page,
}) => {
  await seedCart(page)

  await page.getByRole("button", { name: "Proceed to checkout" }).click()

  await expect(page.getByRole("heading", { name: "Choose how to continue." })).toBeVisible()
  await page.getByRole("button", { name: "Existing customer" }).click()

  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel("Email").fill("customer@codexsun.local")
  await page.getByLabel("Password").fill("Customer@12345")
  await page.getByRole("button", { name: "Login" }).click()

  await expect(page).toHaveURL(/\/checkout$/)
  await expect(
    page.getByRole("heading", { name: "Delivery, payment, and final review." })
  ).toBeVisible()
})

test("cart checkout lets unauthenticated customers choose registration", async ({
  page,
}) => {
  await seedCart(page)

  await page.getByRole("button", { name: "Proceed to checkout" }).click()

  await expect(page.getByRole("heading", { name: "Choose how to continue." })).toBeVisible()
  await page.getByRole("button", { name: "Register new" }).click()

  await expect(page).toHaveURL(/\/customer\/register$/)
  await expect(page.getByText("Create your account")).toBeVisible()
})
