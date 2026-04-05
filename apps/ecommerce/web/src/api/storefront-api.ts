import type {
  CustomerProfile,
  CustomerProfileUpdatePayload,
  CustomerRegisterPayload,
  StorefrontHomeSlider,
  StorefrontSettings,
  StorefrontCatalogResponse,
  StorefrontCheckoutPayload,
  StorefrontCheckoutResponse,
  StorefrontLandingResponse,
  StorefrontOrderListResponse,
  StorefrontOrderResponse,
  StorefrontPaymentConfig,
  StorefrontProductResponse,
} from "@ecommerce/shared"

type JsonRequestOptions = RequestInit & {
  accessToken?: string | null
}

async function requestJson<T>(url: string, options: JsonRequestOptions = {}) {
  const headers = new Headers(options.headers)
  const hasBody = options.body != null

  if (hasBody && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  if (options.accessToken) {
    headers.set("authorization", `Bearer ${options.accessToken}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; context?: { issues?: Array<{ path?: Array<string | number>; message?: string }> } }
    | T
    | null

  if (!response.ok) {
    const issueDetail =
      typeof payload === "object" &&
      payload &&
      "context" in payload &&
      payload.context?.issues?.[0]
        ? `${payload.context.issues[0]?.path?.join(".") ?? "payload"}: ${payload.context.issues[0]?.message ?? "Invalid value"}`
        : null

    throw new Error(
      typeof payload === "object" && payload && "error" in payload && payload.error
        ? issueDetail
          ? `${String(payload.error)} ${issueDetail}`
          : String(payload.error)
        : `Request failed with status ${response.status}`
    )
  }

  return payload as T
}

export const storefrontApi = {
  getHome() {
    return requestJson<StorefrontLandingResponse>("/public/v1/storefront/home", {
      cache: "no-store",
    })
  },
  getCatalog(searchParams: URLSearchParams) {
    const url = new URL("/public/v1/storefront/catalog", window.location.origin)
    searchParams.forEach((value, key) => {
      if (value.trim()) {
        url.searchParams.set(key, value)
      }
    })

    return requestJson<StorefrontCatalogResponse>(url.toString(), { cache: "no-store" })
  },
  getProduct(slug: string) {
    const url = new URL("/public/v1/storefront/product", window.location.origin)
    url.searchParams.set("slug", slug)

    return requestJson<StorefrontProductResponse>(url.toString(), { cache: "no-store" })
  },
  getStorefrontSettings(accessToken: string) {
    return requestJson<StorefrontSettings>("/internal/v1/ecommerce/storefront-settings", {
      accessToken,
      cache: "no-store",
    })
  },
  updateStorefrontSettings(accessToken: string, payload: StorefrontSettings) {
    return requestJson<StorefrontSettings>("/internal/v1/ecommerce/storefront-settings", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getHomeSlider(accessToken: string) {
    return requestJson<StorefrontHomeSlider>("/internal/v1/ecommerce/home-slider", {
      accessToken,
      cache: "no-store",
    })
  },
  updateHomeSlider(accessToken: string, payload: StorefrontHomeSlider) {
    return requestJson<StorefrontHomeSlider>("/internal/v1/ecommerce/home-slider", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getPaymentConfig() {
    return requestJson<StorefrontPaymentConfig>("/public/v1/storefront/payment-config", {
      cache: "no-store",
    })
  },
  trackOrder(orderNumber: string, email: string) {
    const url = new URL("/public/v1/storefront/track-order", window.location.origin)
    url.searchParams.set("orderNumber", orderNumber)
    url.searchParams.set("email", email)

    return requestJson<StorefrontOrderResponse>(url.toString(), { cache: "no-store" })
  },
  registerCustomer(payload: CustomerRegisterPayload) {
    return requestJson<CustomerProfile>("/api/v1/storefront/customers/register", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
  getCustomerProfile(accessToken: string) {
    return requestJson<CustomerProfile>("/api/v1/storefront/customers/me", {
      accessToken,
      cache: "no-store",
    })
  },
  updateCustomerProfile(accessToken: string, payload: CustomerProfileUpdatePayload) {
    return requestJson<CustomerProfile>("/api/v1/storefront/customers/me", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  createCheckout(accessToken: string | null, payload: StorefrontCheckoutPayload) {
    return requestJson<StorefrontCheckoutResponse>("/api/v1/storefront/checkout", {
      method: "POST",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  verifyCheckoutPayment(payload: {
    orderId: string
    providerOrderId: string
    providerPaymentId: string
    signature: string
  }) {
    return requestJson<StorefrontOrderResponse>(
      "/api/v1/storefront/checkout/payment/verify",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    )
  },
  listCustomerOrders(accessToken: string) {
    return requestJson<StorefrontOrderListResponse>("/api/v1/storefront/orders", {
      accessToken,
      cache: "no-store",
    })
  },
  getCustomerOrder(accessToken: string, orderId: string) {
    const url = new URL("/api/v1/storefront/order", window.location.origin)
    url.searchParams.set("id", orderId)

    return requestJson<StorefrontOrderResponse>(url.toString(), {
      accessToken,
      cache: "no-store",
    })
  },
}
