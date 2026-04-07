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
  const addressSection = page
    .locator("section, div")
    .filter({ has: page.getByRole("heading", { name: "Delivery address" }) })
    .first()
  const savedAddressOptions = addressSection.locator('[role="radio"]')

  const hasAuthSession = await page.evaluate(() => {
    const sessionRaw = window.localStorage.getItem("codexsun.auth.session")
    if (!sessionRaw) {
      return false
    }

    try {
      const session = JSON.parse(sessionRaw) as { accessToken?: string }
      return Boolean(session.accessToken)
    } catch {
      return false
    }
  })

  if (!hasAuthSession) {
    await page.getByRole("button", { name: "Add new address" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "Add delivery address" })).toBeVisible()
    await dialog.getByLabel("Address label").fill("Home")
    await dialog.getByLabel("Phone").fill("+919876543210")
    await dialog.getByLabel("First name").fill("Customer")
    await dialog.getByLabel("Address line 1").fill("45 Test Street")
    await chooseLookupOption(dialog, "Country", "India")
    await chooseLookupOption(dialog, "State", "Tamil Nadu")
    await chooseLookupOption(dialog, "District", "Chennai")
    await chooseLookupOption(dialog, "City", "Chennai")
    await chooseLookupOption(dialog, "Postal code", /600001/)

    await dialog
      .getByRole("button", { name: "Save address" })
      .evaluate((button: HTMLButtonElement) => button.click())
    await expect(dialog).not.toBeVisible()
    return
  }

  await page.evaluate(async () => {
    const sessionRaw = window.localStorage.getItem("codexsun.auth.session")
    if (!sessionRaw) {
      throw new Error("Missing storefront auth session.")
    }

    const session = JSON.parse(sessionRaw) as { accessToken?: string }
    const accessToken = session.accessToken
    if (!accessToken) {
      throw new Error("Missing storefront access token.")
    }

    async function requestJson<T>(url: string, init?: RequestInit) {
      const response = await fetch(url, {
        ...init,
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
      })
      const payload = (await response.json().catch(() => null)) as T | { error?: string } | null
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" && payload && "error" in payload && payload.error
            ? payload.error
            : `Request failed with status ${response.status}`
        )
      }
      return payload as T
    }

    const [profile, lookups] = await Promise.all([
      requestJson<any>("/api/v1/storefront/customers/me", { method: "GET" }),
      requestJson<any>("/api/v1/storefront/customers/me/lookups", { method: "GET" }),
    ])

    const pickResolvedItem = (items: Array<Record<string, unknown>> | undefined) =>
      items?.find((item) => String(item.id ?? "") !== "1") ?? items?.[0] ?? null

    const country = pickResolvedItem(lookups.countries)
    const state =
      lookups.states?.find(
        (item: Record<string, unknown>) =>
          String(item.id ?? "") !== "1" && item.country_id === country?.id
      ) ??
      pickResolvedItem(lookups.states) ??
      null
    const city =
      lookups.cities?.find(
        (item: Record<string, unknown>) =>
          String(item.id ?? "") !== "1" && item.state_id === state?.id
      ) ??
      pickResolvedItem(lookups.cities) ??
      null
    const pincode =
      lookups.pincodes?.find(
        (item: Record<string, unknown>) =>
          String(item.id ?? "") !== "1" &&
          (item.city_id === city?.id || item.state_id === state?.id)
      ) ??
      pickResolvedItem(lookups.pincodes) ??
      null

    const nextPayload = {
      displayName: profile.displayName,
      phoneNumber: profile.phoneNumber,
      companyName: profile.companyName,
      legalName: profile.legalName,
      gstin: profile.gstin,
      website: profile.website,
      addresses: [{
        addressTypeId: String(pickResolvedItem(lookups.addressTypes)?.id ?? "1"),
        addressLine1: "45 Test Street",
        addressLine2: "Suite 3",
        cityId: String(city?.id ?? "1"),
        districtId: String((pincode?.district_id as string | undefined) ?? (city?.district_id as string | undefined) ?? "1"),
        stateId: String(state?.id ?? "1"),
        countryId: String(country?.id ?? "1"),
        pincodeId: String(pincode?.id ?? "1"),
        latitude: null,
        longitude: null,
        isDefault: true,
      }],
      emails: Array.isArray(profile.emails)
        ? profile.emails.map((entry: Record<string, unknown>) => ({
            email: String(entry.email ?? profile.email),
            emailType: String(entry.emailType ?? "primary"),
            isPrimary: Boolean(entry.isPrimary),
          }))
        : [{ email: String(profile.email), emailType: "primary", isPrimary: true }],
      phones: Array.isArray(profile.phones) && profile.phones.length > 0
        ? profile.phones.map((entry: Record<string, unknown>) => ({
            phoneNumber: String(entry.phoneNumber ?? profile.phoneNumber),
            phoneType: String(entry.phoneType ?? "primary"),
            isPrimary: Boolean(entry.isPrimary),
          }))
        : [{ phoneNumber: String(profile.phoneNumber), phoneType: "primary", isPrimary: true }],
      bankAccounts: Array.isArray(profile.bankAccounts) ? profile.bankAccounts : [],
      gstDetails: Array.isArray(profile.gstDetails) ? profile.gstDetails : [],
    }

    await requestJson("/api/v1/storefront/customers/me", {
      method: "PATCH",
      body: JSON.stringify(nextPayload),
    })
  })

  await page.reload()
  await expect(page.getByRole("heading", { name: "Delivery, payment, and final review." })).toBeVisible()
  await expect(savedAddressOptions.first()).toBeVisible()
  await savedAddressOptions.first().click()
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

async function continueFromCartToCheckout(page: import("@playwright/test").Page) {
  await page.goto("/checkout")

  const checkoutHeading = page.getByRole("heading", {
    name: "Delivery, payment, and final review.",
  })
  const checkoutAccessHeading = page.getByRole("heading", {
    name: "Sign in before checkout.",
  })
  const loginHeading = page.getByRole("heading", { name: "Welcome" })

  await Promise.race([
    checkoutHeading.waitFor({ state: "visible", timeout: 10000 }),
    checkoutAccessHeading.waitFor({ state: "visible", timeout: 10000 }),
    loginHeading.waitFor({ state: "visible", timeout: 10000 }),
  ])

  if (await checkoutAccessHeading.isVisible()) {
    await page.getByRole("button", { name: "Existing customer" }).click()
  }

  if (await loginHeading.isVisible()) {
    await page.getByLabel("Email").fill("customer@codexsun.local")
    await page.getByLabel("Password").fill("Customer@12345")
    await page.getByRole("button", { name: "Login" }).click()
    await page.waitForURL(/\/(customer|checkout)$/)
    if (!/\/checkout$/.test(page.url())) {
      await page.goto("/checkout")
    }
  }

  await expect(checkoutHeading).toBeVisible()
}

test("customer can buy from product page, checkout, and track the order", async ({
  page,
}) => {
  await page.goto("/")
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
  await contactEmail.fill("customer@codexsun.local")
  await expect(contactEmail).toHaveValue(/customer@codexsun\.local/)

  await page.getByRole("button", { name: "Continue to pay" }).click()
  await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()

  const orderNumberText = await page.getByText(/ECM-\d{8}-\d{4}/).textContent()
  const orderNumberMatch = orderNumberText?.match(/(ECM-\d{8}-\d{4})/)
  expect(orderNumberMatch).not.toBeNull()
  const orderNumber = orderNumberMatch![1]

  await page.getByRole("link", { name: "Open order page" }).click()
  await page.waitForURL(/\/(customer\/orders\/|track-order)/)
  if (/\/customer\/orders\//.test(page.url())) {
    await expect(page.getByText("Order overview")).toBeVisible()
    await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible()
  } else {
    await expect(page.getByRole("heading", { name: "Track your order" })).toBeVisible()
    await expect(page.getByText(orderNumber)).toBeVisible()
  }

  await page.goto(
    `/track-order?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent("customer@codexsun.local")}`
  )

  await expect(page.getByRole("heading", { name: "Track your order" })).toBeVisible()
  await expect(page.getByText(orderNumber)).toBeVisible()
  await expect(page.getByText("Payment Paid")).toBeVisible()
  await expect(page.getByText("Total paid")).toBeVisible()
  await expect(page.getByText("Timeline", { exact: true })).toBeVisible()
  await expect(page.getByText("Payment captured")).toBeVisible()
  await expect(page.getByText("Order paid")).toBeVisible()
})
