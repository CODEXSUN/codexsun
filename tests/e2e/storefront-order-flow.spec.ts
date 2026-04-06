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

async function ensureCheckoutAddress(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Add new address" }).click()
  await expect(page.getByRole("heading", { name: "Add delivery address" })).toBeVisible()
  await page.getByLabel("Address label").fill("Home")
  await page.getByLabel("Phone").fill("+919876543210")
  await page.getByLabel("First name").fill("Customer")
  await page.getByLabel("Address line 1").fill("45 Test Street")
  await page.getByRole("button", { name: "Save address" }).click()
  await expect(page.getByRole("heading", { name: "Add delivery address" })).not.toBeVisible()
}

async function continueFromCartToCheckout(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Proceed to checkout" }).click()

  const checkoutHeading = page.getByRole("heading", {
    name: "Delivery, payment, and final review.",
  })
  const checkoutAccessHeading = page.getByRole("heading", {
    name: "Sign in before checkout.",
  })

  await Promise.race([
    checkoutHeading.waitFor({ state: "visible", timeout: 10000 }),
    checkoutAccessHeading.waitFor({ state: "visible", timeout: 10000 }),
  ])

  if (await checkoutAccessHeading.isVisible()) {
    await page.getByRole("button", { name: "Existing customer" }).click()

    const loginHeading = page.getByRole("heading", { name: "Welcome" })
    if (await loginHeading.isVisible()) {
      await page.getByLabel("Email").fill("customer@codexsun.local")
      await page.getByLabel("Password").fill("Customer@12345")
      await page.getByRole("button", { name: "Login" }).click()
    }
  }

  await expect(checkoutHeading).toBeVisible()
}

test("customer can buy from product page, checkout, and track the order", async ({
  page,
}) => {
    await login(page, "customer@codexsun.local", "Customer@12345")

    await expect(page).toHaveURL(/\/customer$/)

    await page.evaluate(() => {
      window.localStorage.removeItem("codexsun.storefront.cart")
    })

    await page.goto("/products/aster-linen-shirt")

    await expect(
      page.getByRole("heading", { name: "Aster Linen Shirt" })
    ).toBeVisible()

    await page.getByRole("button", { name: "Add to cart" }).click()
    await page.goto("/cart")

    await expect(
      page.getByRole("link", { name: "Aster Linen Shirt" })
    ).toBeVisible()

    await continueFromCartToCheckout(page)

    await ensureCheckoutAddress(page)

    const contactEmail = page.getByLabel("Contact email")
    await expect(contactEmail).toHaveValue(/customer@codexsun\.local/)

    await page.getByRole("button", { name: "Continue to pay" }).click()
    await expect(page.getByRole("heading", { name: "Complete payment" })).toBeVisible()
    await page.getByRole("button", { name: "Pay now" }).click()

    const successMessage = page.getByText(/Payment recorded for ECM-/)
    await expect(successMessage).toBeVisible()

    const successText = (await successMessage.textContent()) ?? ""
    const orderNumberMatch = successText.match(/(ECM-\d{8}-\d{4})/)
    expect(orderNumberMatch).not.toBeNull()
    const orderNumber = orderNumberMatch![1]

    await expect(page).toHaveURL(/\/customer\/orders\//)
    await expect(page.getByText("Order detail")).toBeVisible()
    await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible()

    await page.goto(
      `/track-order?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent("customer@codexsun.local")}`
    )

    await expect(page.getByRole("heading", { name: "Track your order" })).toBeVisible()
    await expect(page.getByText(orderNumber)).toBeVisible()
    await expect(page.getByText("Payment", { exact: true })).toBeVisible()
    await expect(page.getByText("paid")).toBeVisible()
    await expect(page.getByText("Timeline")).toBeVisible()
    await expect(page.getByText("Order confirmed")).toBeVisible()
})
