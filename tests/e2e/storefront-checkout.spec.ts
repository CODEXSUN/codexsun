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

async function chooseLookupOption(
  scope: import("@playwright/test").Locator,
  fieldLabel: string,
  optionName: string | RegExp
) {
  const field = scope.getByText(fieldLabel, { exact: true }).locator("xpath=..")
  const triggerButton = field.getByRole("button").first()

  if (typeof optionName === "string" && (await triggerButton.textContent())?.trim() === optionName) {
    return
  }

  await triggerButton.click()

  const optionButton = scope.getByRole("button", { name: optionName }).last()
  if (await optionButton.count()) {
    await optionButton.click()
    return
  }

  const searchInput = scope.getByPlaceholder(new RegExp(`Search ${fieldLabel}`, "i"))
  await searchInput.fill(typeof optionName === "string" ? optionName : "")
  await scope.getByRole("button", { name: optionName }).last().click()
}

async function saveAddressFromDialog(
  dialog: import("@playwright/test").Locator,
  input: {
    label: string
    phone: string
    firstName: string
    line1: string
  }
) {
  await dialog.getByLabel("Address label").fill(input.label)
  await dialog.getByLabel("Phone").fill(input.phone)
  await dialog.getByLabel("First name").fill(input.firstName)
  await dialog.getByLabel("Address line 1").fill(input.line1)
  await expect(dialog.getByText("District", { exact: true })).toBeVisible()
  await chooseLookupOption(dialog, "Country", "India")
  await chooseLookupOption(dialog, "State", "Tamil Nadu")
  await chooseLookupOption(dialog, "District", "Chennai")
  await chooseLookupOption(dialog, "City", "Chennai")
  await chooseLookupOption(dialog, "Postal code", /600001/)
  const saveButton = dialog.getByRole("button", { name: /Save address|Update address/ })
  await expect(saveButton).toBeEnabled()
  await saveButton.evaluate((button: HTMLButtonElement) => button.click())
  await expect(dialog).not.toBeVisible()
}

async function prepareGuestCheckout(page: import("@playwright/test").Page) {
  await seedCart(page)
  await page.goto("/cart")
  await page.getByRole("button", { name: "Proceed to checkout" }).click()
  await expect(page.getByRole("heading", { name: "Choose how to continue." })).toBeVisible()
  await page.getByRole("button", { name: "Continue as guest" }).click()
  await expect(
    page.getByRole("heading", { name: "Delivery, payment, and final review." })
  ).toBeVisible()

  await page.getByRole("button", { name: "Add new address" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByRole("heading", { name: "Add delivery address" })).toBeVisible()
  await saveAddressFromDialog(dialog, {
    label: "Home",
    phone: "+919876543210",
    firstName: "Guest",
    line1: "45 Test Street",
  })

  await page.getByLabel("Contact email").fill("guest.checkout@codexsun.local")
}

async function mockLiveRazorpay(
  page: import("@playwright/test").Page,
  scenarios: Array<"dismiss" | "success" | "verify-fail">
) {
  await page.addInitScript((scenarioQueue) => {
    ;(window as Window & {
      __razorpayScenarioQueue?: string[]
      __razorpayOpenCount?: number
      Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
    }).__razorpayScenarioQueue = [...scenarioQueue]
    ;(window as Window & { __razorpayOpenCount?: number }).__razorpayOpenCount = 0
    ;(window as Window & {
      Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
      __razorpayScenarioQueue?: string[]
      __razorpayOpenCount?: number
    }).Razorpay = function (options: Record<string, unknown>) {
      return {
        open() {
          const globalWindow = window as Window & {
            __razorpayScenarioQueue?: string[]
            __razorpayOpenCount?: number
          }
          globalWindow.__razorpayOpenCount = (globalWindow.__razorpayOpenCount ?? 0) + 1
          const scenario = globalWindow.__razorpayScenarioQueue?.shift() ?? "dismiss"

          if (scenario === "dismiss") {
            const modal = options.modal as { ondismiss?: () => void } | undefined
            modal?.ondismiss?.()
            return
          }

          const handler = options.handler as
            | ((response: {
                razorpay_order_id: string
                razorpay_payment_id: string
                razorpay_signature: string
              }) => void)
            | undefined

          handler?.({
            razorpay_order_id: String(options.order_id ?? "order_live_001"),
            razorpay_payment_id:
              scenario === "verify-fail" ? "pay_live_fail_001" : "pay_live_success_001",
            razorpay_signature:
              scenario === "verify-fail" ? "bad_signature" : "live_signature_001",
          })
        },
      }
    } as new (options: Record<string, unknown>) => { open: () => void }
  }, scenarios)
}

function createLiveCheckoutFixtures() {
  const order = {
    id: "storefront-order:live-001",
    orderNumber: "ECM-20260407-9001",
    customerAccountId: null,
    coreContactId: "contact:guest-live-001",
    status: "pending_payment",
    paymentStatus: "pending",
    paymentProvider: "razorpay",
    paymentMode: "live",
    fulfillmentMethod: "delivery",
    paymentCollectionMethod: "online",
    pickupLocation: null,
    providerOrderId: "order_live_001",
    providerPaymentId: null,
    shippingAddress: {
      fullName: "Guest Customer",
      email: "guest.checkout@codexsun.local",
      phoneNumber: "+919876543210",
      line1: "45 Test Street",
      line2: null,
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      pincode: "600001",
    },
    billingAddress: {
      fullName: "Guest Customer",
      email: "guest.checkout@codexsun.local",
      phoneNumber: "+919876543210",
      line1: "45 Test Street",
      line2: null,
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      pincode: "600001",
    },
    items: [
      {
        id: "order-item:live-001",
        productId: "core-product:aster-linen-shirt",
        slug: "aster-linen-shirt",
        name: "Aster Linen Shirt",
        brandName: null,
        imageUrl: null,
        variantLabel: null,
        attributes: [],
        quantity: 1,
        unitPrice: 1890,
        mrp: 2230,
        lineTotal: 1890,
      },
    ],
    itemCount: 1,
    subtotalAmount: 1890,
    discountAmount: 340,
    shippingAmount: 149,
    handlingAmount: 99,
    totalAmount: 2138,
    currency: "INR",
    notes: null,
    timeline: [
      {
        id: "timeline:live-created",
        code: "order_created",
        label: "Order created",
        summary: "Checkout order was created and is awaiting payment.",
        createdAt: "2026-04-07T12:00:00.000Z",
      },
    ],
    createdAt: "2026-04-07T12:00:00.000Z",
    updatedAt: "2026-04-07T12:00:00.000Z",
  }

  return {
    checkoutResponse: {
      order,
      payment: {
        provider: "razorpay",
        mode: "live",
        keyId: "rzp_live_test_key",
        providerOrderId: "order_live_001",
        amount: 213800,
        currency: "INR",
        receipt: order.orderNumber,
        businessName: "Tirupur Direct",
        checkoutImage: null,
        themeColor: "#1f2937",
      },
    },
    verifiedOrderResponse: {
      item: {
        ...order,
        status: "confirmed",
        paymentStatus: "paid",
        providerPaymentId: "pay_live_success_001",
        timeline: [
          ...order.timeline,
          {
            id: "timeline:live-paid",
            code: "payment_captured",
            label: "Payment captured",
            summary: "Razorpay payment was verified successfully.",
            createdAt: "2026-04-07T12:01:00.000Z",
          },
          {
            id: "timeline:live-confirmed",
            code: "order_confirmed",
            label: "Order confirmed",
            summary: "The order is confirmed and queued for fulfillment.",
            createdAt: "2026-04-07T12:01:00.000Z",
          },
        ],
        updatedAt: "2026-04-07T12:01:00.000Z",
      },
    },
  }
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
  await expect(page.getByText("District", { exact: true })).toBeVisible()
  await expect(page.getByText("City", { exact: true })).toBeVisible()
  await expect(page.getByText("Postal code", { exact: true })).toBeVisible()
  await expect(page.getByText("Set as default delivery address")).toBeVisible()
  const dialog = page.getByRole("dialog")
  await saveAddressFromDialog(dialog, {
    label: "Home",
    phone: "+919876543210",
    firstName: "Customer",
    line1: "45 Test Street",
  })

  await page.getByRole("button", { name: "Continue to pay" }).click()
  await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
  await expect(page.getByText(/ECM-\d{8}-\d{4}/)).toBeVisible()
  await page.getByRole("link", { name: "Open order page" }).click()
  await expect(page).toHaveURL(/\/customer\/orders\//)
  await expect(page.getByText("Order overview")).toBeVisible()
})

test("guest can continue from cart to checkout and place an order", async ({
  page,
}) => {
  await prepareGuestCheckout(page)
  await page.getByRole("button", { name: "Continue to pay" }).click()

  await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
  const orderNumberText = await page.getByText(/ECM-\d{8}-\d{4}/).textContent()
  const orderNumberMatch = orderNumberText?.match(/(ECM-\d{8}-\d{4})/)
  expect(orderNumberMatch).not.toBeNull()
  const orderNumber = orderNumberMatch![1]

  await page.getByRole("link", { name: "Open order page" }).click()
  await expect(page).toHaveURL(/\/track-order\?/)
  await expect(page.getByRole("heading", { name: "Track your order" })).toBeVisible()
  await expect(page.getByText(orderNumber)).toBeVisible()
  await expect(page.getByText("Payment Paid")).toBeVisible()
})

test("live checkout can reopen the same payment after modal close without creating a duplicate order", async ({
  page,
}) => {
  const fixtures = createLiveCheckoutFixtures()
  let checkoutCreateCount = 0
  let paymentVerifyCount = 0

  await mockLiveRazorpay(page, ["dismiss", "success"])

  await page.route("**/api/v1/storefront/checkout/payment/verify", async (route) => {
    paymentVerifyCount += 1
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fixtures.verifiedOrderResponse),
    })
  })

  await page.route("**/api/v1/storefront/checkout", async (route) => {
    checkoutCreateCount += 1
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(fixtures.checkoutResponse),
    })
  })

  await prepareGuestCheckout(page)
  await page.getByRole("button", { name: "Continue to pay" }).click()

  await expect(page.getByText("Razorpay checkout was closed before payment completed.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Reopen payment" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Retry payment" })).toBeVisible()

  await page.getByRole("button", { name: "Reopen payment" }).click()

  await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
  expect(checkoutCreateCount).toBe(1)
  expect(paymentVerifyCount).toBe(1)
  await expect.poll(() => page.evaluate(() => (window as Window & { __razorpayOpenCount?: number }).__razorpayOpenCount ?? 0)).toBe(2)
})

test("live checkout can retry the same payment session after verification failure", async ({
  page,
}) => {
  const fixtures = createLiveCheckoutFixtures()
  let checkoutCreateCount = 0
  let paymentVerifyCount = 0

  await mockLiveRazorpay(page, ["verify-fail", "success"])

  await page.route("**/api/v1/storefront/checkout/payment/verify", async (route) => {
    paymentVerifyCount += 1

    if (paymentVerifyCount === 1) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Payment signature could not be verified." }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fixtures.verifiedOrderResponse),
    })
  })

  await page.route("**/api/v1/storefront/checkout", async (route) => {
    checkoutCreateCount += 1
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(fixtures.checkoutResponse),
    })
  })

  await prepareGuestCheckout(page)
  await page.getByRole("button", { name: "Continue to pay" }).click()

  await expect(page.getByText("Payment signature could not be verified.")).toBeVisible()
  await expect(
    page.getByRole("alert").getByRole("button", { name: "Retry payment" })
  ).toBeVisible()

  await page.getByRole("alert").getByRole("button", { name: "Retry payment" }).click()

  await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
  expect(checkoutCreateCount).toBe(1)
  expect(paymentVerifyCount).toBe(2)
  await expect.poll(() => page.evaluate(() => (window as Window & { __razorpayOpenCount?: number }).__razorpayOpenCount ?? 0)).toBe(2)
})

test("authenticated customer can sign in from cart, return to checkout, and place an order", async ({
  page,
}) => {
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

  await page.goto("/cart")
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
  await expect(page.getByRole("radio", { name: /Customer Demo/ }).last()).toBeChecked()

  await page.getByRole("button", { name: "Continue to pay" }).click()
  await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
  await page.getByRole("link", { name: "Open order page" }).click()
  await expect(page).toHaveURL(/\/customer\/orders\//)
  await expect(page.getByText("Order overview")).toBeVisible()
})
