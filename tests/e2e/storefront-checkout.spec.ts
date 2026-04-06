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

test("checkout matches the storefront flow and exposes the add-address dialog", async ({
  page,
}) => {
  await login(page, "customer@codexsun.local", "Customer@12345")

  await expect(page).toHaveURL(/\/customer$/)

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

  await page.goto("/checkout")

  await expect(
    page.getByRole("heading", { name: "Delivery, payment, and final review." })
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: "Delivery address" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Delivery preference" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Payment method" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Order summary" })).toBeVisible()

  await page.getByRole("button", { name: "Add new address" }).click()

  await expect(page.getByRole("heading", { name: "Add delivery address" })).toBeVisible()
  await expect(page.getByLabel("Address label")).toBeVisible()
  await expect(page.getByLabel("Phone")).toBeVisible()
  await expect(page.getByText("Country", { exact: true })).toBeVisible()
  await expect(page.getByText("State", { exact: true })).toBeVisible()
  await expect(page.getByText("City", { exact: true })).toBeVisible()
  await expect(page.getByText("Postal code", { exact: true })).toBeVisible()
  await expect(page.getByText("Set as default delivery address")).toBeVisible()
  await page.getByLabel("Phone").fill("+919876543210")
  await page.getByLabel("First name").fill("Customer")
  await page.getByLabel("Address line 1").fill("45 Test Street")
  await page.getByRole("button", { name: "Save address" }).click()
  await expect(page.getByRole("heading", { name: "Add delivery address" })).not.toBeVisible()

  await page.getByRole("button", { name: "Continue to pay" }).click()
  await expect(page.getByRole("heading", { name: "Complete payment" })).toBeVisible()
  await expect(page.getByLabel("Mobile number")).toBeVisible()
  await expect(page.locator("#payment-contact-email")).toBeVisible()

  await page.getByRole("button", { name: "Pay now" }).click()
  await expect(page.getByText(/Payment recorded for ECM-/)).toBeVisible()
  await expect(page).toHaveURL(/\/customer\/orders\//)
  await expect(page.getByText("Order detail")).toBeVisible()
})
