import { expect, test } from "@playwright/test"

async function seedCart(page: import("@playwright/test").Page) {
  await page.goto("/")
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
}

test("storefront core flows expose skip navigation and labeled controls", async ({ page }) => {
  await page.goto("/")
  const skipLink = page.getByRole("link", { name: "Skip to main content" })
  await skipLink.focus()
  await expect(skipLink).toBeFocused()

  await page.goto("/catalog")
  await expect(page.locator('[aria-label="Search for products, brands, and categories"]:visible').first()).toBeVisible()
  await expect(page.locator('[aria-label="All Category"]:visible').first()).toBeVisible()
  await expect(page.locator('[aria-label="All departments"]:visible').first()).toBeVisible()
  await expect(page.locator('[aria-label="Featured"]:visible').first()).toBeVisible()

  await page.goto("/products/aster-linen-shirt")
  await expect(page.getByRole("button", { name: /Add to cart/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /Save to wishlist|Wishlisted/i })).toBeVisible()

  await page.goto("/track-order")
  await expect(page.getByLabel("Order number")).toBeVisible()
  await expect(page.getByLabel("Email")).toBeVisible()
  await expect(page.getByRole("button", { name: "Track" })).toBeVisible()

  await seedCart(page)
  await page.goto("/cart")
  await expect(page.getByRole("button", { name: /Remove .* from cart/i })).toBeVisible()
  await page.getByRole("button", { name: "Proceed to checkout" }).click()
  await page.getByRole("button", { name: "Continue as guest" }).click()
  await expect(page.getByLabel("Contact email")).toBeVisible()
  await expect(page.getByLabel("Order note")).toBeVisible()
})
