import { expect, test } from "@playwright/test"

const devices = [
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-412", width: 412, height: 915 },
  { name: "tablet-768", width: 768, height: 1024 },
] as const

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

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 4)
  expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 4)
}

for (const device of devices) {
  test.describe(`storefront mobile matrix ${device.name}`, () => {
    test.use({
      viewport: { width: device.width, height: device.height },
    })

    test("homepage, catalog, PDP, cart, checkout, and tracking stay within viewport", async ({
      page,
    }) => {
      await page.goto("/")
      await expect(
        page
          .getByRole("heading", {
            name: /Curated product stories|Category-led browsing|Fresh into the catalog/i,
          })
          .first()
      ).toBeVisible()
      await expectNoHorizontalOverflow(page)

      await page.goto("/catalog")
      await expect(page.locator('[aria-label="Search for products, brands, and categories"]:visible').first()).toBeVisible()
      await expect(page.locator('[aria-label="All Category"]:visible').first()).toBeVisible()
      await expectNoHorizontalOverflow(page)

      await page.goto("/products/aster-linen-shirt")
      await expect(page.getByRole("button", { name: /Add to cart/i })).toBeVisible()
      await expect(page.getByRole("button", { name: /Buy now:|Buy now/i }).first()).toBeVisible()
      await expectNoHorizontalOverflow(page)

      await seedCart(page)
      await page.goto("/cart")
      await expect(
        page.getByRole("heading", { name: /Review your selected styles\./i })
      ).toBeVisible()
      await expect(page.getByRole("button", { name: /Proceed to checkout/i })).toBeVisible()
      await expectNoHorizontalOverflow(page)

      await page.getByRole("button", { name: "Proceed to checkout" }).click()
      await expect(page.getByRole("heading", { name: "Choose how to continue." })).toBeVisible()
      await expectNoHorizontalOverflow(page)

      await page.getByRole("button", { name: "Continue as guest" }).click()
      await expect(
        page.getByRole("heading", { name: "Delivery, payment, and final review." })
      ).toBeVisible()
      await expect(page.getByLabel("Contact email")).toBeVisible()
      await expectNoHorizontalOverflow(page)

      await page.goto("/track-order")
      await expect(page.getByLabel("Order number")).toBeVisible()
      await expect(page.getByLabel("Email")).toBeVisible()
      await expectNoHorizontalOverflow(page)
    })
  })
}
