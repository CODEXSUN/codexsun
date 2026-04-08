import type {
  CustomerProfileLookupResponse,
  CustomerProfile,
  CustomerPortalPreferencesUpdatePayload,
  CustomerPortalResponse,
  CustomerProfileUpdatePayload,
  CustomerRegisterPayload,
  EcommerceSettings,
  StorefrontCustomerAdminReport,
  StorefrontCustomerAdminResponse,
  StorefrontCustomerWelcomeMailSendResponse,
  StorefrontCustomerPermanentDeleteResponse,
  StorefrontCustomerSelfDeactivateResponse,
  StorefrontSupportCaseCreatePayload,
  StorefrontSupportCaseListResponse,
  StorefrontSupportCaseResponse,
  StorefrontSupportQueueReport,
  StorefrontOrderRequestCreatePayload,
  StorefrontOrderRequestListResponse,
  StorefrontOrderRequestQueueReport,
  StorefrontOrderRequestResponse,
  StorefrontHomeSlider,
  StorefrontSettings,
  StorefrontSettingsVersionHistoryResponse,
  StorefrontSettingsWorkflowStatus,
  StorefrontFooter,
  StorefrontFloatingContact,
  StorefrontPickupLocation,
  StorefrontCouponBanner,
  StorefrontGiftCorner,
  StorefrontBrandShowcase,
  StorefrontCampaignSection,
  StorefrontAdminOrderOperationsReport,
  StorefrontLegalPageResponse,
  StorefrontTrendingSection,
  StorefrontCatalogResponse,
  StorefrontCheckoutPayload,
  StorefrontCheckoutResponse,
  StorefrontLandingResponse,
  StorefrontOrderListResponse,
  StorefrontOrderResponse,
  StorefrontCommunicationHealthResponse,
  StorefrontCommunicationLogResponse,
  StorefrontCommunicationResendResponse,
  StorefrontPaymentConfig,
  StorefrontOperationalAgingReport,
  StorefrontAccountingCompatibilityReport,
  StorefrontPaymentOperationsReport,
  StorefrontPaymentReconciliationResponse,
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

async function downloadDocument(
  accessToken: string,
  url: URL,
  fallbackFileName: string
) {
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`)
  }

  const text = await response.text()
  return {
    fileName: extractDownloadFileName(
      response.headers.get("content-disposition"),
      fallbackFileName
    ),
    blob: new Blob([text], {
      type: response.headers.get("content-type") ?? "text/csv;charset=utf-8",
    }),
  }
}

function extractDownloadFileName(disposition: string | null, fallback: string) {
  if (!disposition) {
    return fallback
  }

  const match = disposition.match(/filename=\"?([^\";]+)\"?/)
  return match?.[1] ?? fallback
}

export const storefrontApi = {
  getHome() {
    return requestJson<StorefrontLandingResponse>("/public/v1/storefront/home", {
      cache: "no-store",
    })
  },
  getPublicStorefrontSettings() {
    return requestJson<StorefrontSettings>("/public/v1/storefront/settings", {
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
  getLegalPage(pageId: "shipping" | "returns" | "privacy" | "terms" | "contact") {
    const url = new URL("/public/v1/storefront/legal-page", window.location.origin)
    url.searchParams.set("pageId", pageId)

    return requestJson<StorefrontLegalPageResponse>(url.toString(), { cache: "no-store" })
  },
  getStorefrontSettings(accessToken: string) {
    return requestJson<StorefrontSettings>("/internal/v1/ecommerce/storefront-settings", {
      accessToken,
      cache: "no-store",
    })
  },
  getEcommerceSettings(accessToken: string) {
    return requestJson<EcommerceSettings>("/internal/v1/ecommerce/settings", {
      accessToken,
      cache: "no-store",
    })
  },
  updateEcommerceSettings(
    accessToken: string,
    payload: { automation?: { autoSendWelcomeMail?: boolean } }
  ) {
    return requestJson<EcommerceSettings>("/internal/v1/ecommerce/settings", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getStorefrontSettingsWorkflow(accessToken: string) {
    return requestJson<StorefrontSettingsWorkflowStatus>(
      "/internal/v1/ecommerce/storefront-settings/workflow",
      {
        accessToken,
        cache: "no-store",
      }
    )
  },
  getStorefrontSettingsHistory(accessToken: string) {
    return requestJson<StorefrontSettingsVersionHistoryResponse>(
      "/internal/v1/ecommerce/storefront-settings/history",
      {
        accessToken,
        cache: "no-store",
      }
    )
  },
  updateStorefrontSettings(accessToken: string, payload: StorefrontSettings) {
    return requestJson<StorefrontSettings>("/internal/v1/ecommerce/storefront-settings", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  publishStorefrontSettings(accessToken: string) {
    return requestJson<StorefrontSettingsWorkflowStatus>(
      "/internal/v1/ecommerce/storefront-settings/publish",
      {
        method: "POST",
        accessToken,
        body: JSON.stringify({}),
      }
    )
  },
  rollbackStorefrontSettings(accessToken: string, revisionId?: string | null) {
    return requestJson<StorefrontSettingsWorkflowStatus>(
      "/internal/v1/ecommerce/storefront-settings/rollback",
      {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          revisionId: revisionId?.trim() ? revisionId : null,
        }),
      }
    )
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
  getStorefrontFooter(accessToken: string) {
    return requestJson<StorefrontFooter>("/internal/v1/ecommerce/storefront-footer", {
      accessToken,
      cache: "no-store",
    })
  },
  updateStorefrontFooter(accessToken: string, payload: StorefrontFooter) {
    return requestJson<StorefrontFooter>("/internal/v1/ecommerce/storefront-footer", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getStorefrontFloatingContact(accessToken: string) {
    return requestJson<StorefrontFloatingContact>("/internal/v1/ecommerce/storefront-floating-contact", {
      accessToken,
      cache: "no-store",
    })
  },
  updateStorefrontFloatingContact(accessToken: string, payload: StorefrontFloatingContact) {
    return requestJson<StorefrontFloatingContact>("/internal/v1/ecommerce/storefront-floating-contact", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getStorefrontPickupLocation(accessToken: string) {
    return requestJson<StorefrontPickupLocation>("/internal/v1/ecommerce/storefront-pickup-location", {
      accessToken,
      cache: "no-store",
    })
  },
  updateStorefrontPickupLocation(accessToken: string, payload: StorefrontPickupLocation) {
    return requestJson<StorefrontPickupLocation>("/internal/v1/ecommerce/storefront-pickup-location", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getStorefrontCouponBanner(accessToken: string) {
    return requestJson<StorefrontCouponBanner>("/internal/v1/ecommerce/storefront-coupon-banner", {
      accessToken,
      cache: "no-store",
    })
  },
  updateStorefrontCouponBanner(accessToken: string, payload: StorefrontCouponBanner) {
    return requestJson<StorefrontCouponBanner>("/internal/v1/ecommerce/storefront-coupon-banner", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getStorefrontGiftCorner(accessToken: string) {
    return requestJson<StorefrontGiftCorner>("/internal/v1/ecommerce/storefront-gift-corner", {
      accessToken,
      cache: "no-store",
    })
  },
  updateStorefrontGiftCorner(accessToken: string, payload: StorefrontGiftCorner) {
    return requestJson<StorefrontGiftCorner>("/internal/v1/ecommerce/storefront-gift-corner", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getStorefrontTrendingSection(accessToken: string) {
    return requestJson<StorefrontTrendingSection>("/internal/v1/ecommerce/storefront-trending-section", {
      accessToken,
      cache: "no-store",
    })
  },
  updateStorefrontTrendingSection(accessToken: string, payload: StorefrontTrendingSection) {
    return requestJson<StorefrontTrendingSection>("/internal/v1/ecommerce/storefront-trending-section", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getStorefrontBrandShowcase(accessToken: string) {
    return requestJson<StorefrontBrandShowcase>("/internal/v1/ecommerce/storefront-brand-showcase", {
      accessToken,
      cache: "no-store",
    })
  },
  updateStorefrontBrandShowcase(accessToken: string, payload: StorefrontBrandShowcase) {
    return requestJson<StorefrontBrandShowcase>("/internal/v1/ecommerce/storefront-brand-showcase", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getStorefrontCampaign(accessToken: string) {
    return requestJson<StorefrontCampaignSection>("/internal/v1/ecommerce/storefront-campaign", {
      accessToken,
      cache: "no-store",
    })
  },
  updateStorefrontCampaign(accessToken: string, payload: StorefrontCampaignSection) {
    return requestJson<StorefrontCampaignSection>("/internal/v1/ecommerce/storefront-campaign", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getCommunicationsHealth(accessToken: string) {
    return requestJson<StorefrontCommunicationHealthResponse>("/internal/v1/ecommerce/communications/health", {
      accessToken,
      cache: "no-store",
    })
  },
  getCommunicationsLog(
    accessToken: string,
    input: { orderId?: string | null; customerAccountId?: string | null } = {}
  ) {
    const url = new URL("/internal/v1/ecommerce/communications", window.location.origin)

    if (input.orderId?.trim()) {
      url.searchParams.set("orderId", input.orderId)
    }

    if (input.customerAccountId?.trim()) {
      url.searchParams.set("customerAccountId", input.customerAccountId)
    }

    return requestJson<StorefrontCommunicationLogResponse>(url.toString(), {
      accessToken,
      cache: "no-store",
    })
  },
  getCustomerCommunicationLog(
    accessToken: string,
    input: { orderId?: string | null } = {}
  ) {
    const url = new URL("/api/v1/storefront/customers/me/communications", window.location.origin)

    if (input.orderId?.trim()) {
      url.searchParams.set("orderId", input.orderId)
    }

    return requestJson<StorefrontCommunicationLogResponse>(url.toString(), {
      accessToken,
      cache: "no-store",
    })
  },
  resendCommunication(
    accessToken: string,
    payload: { templateCode: string; orderId?: string | null; customerAccountId?: string | null }
  ) {
    return requestJson<StorefrontCommunicationResendResponse>("/internal/v1/ecommerce/communications/resend", {
      method: "POST",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getPaymentsReport(accessToken: string) {
    return requestJson<StorefrontPaymentOperationsReport>("/internal/v1/ecommerce/payments/report", {
      accessToken,
      cache: "no-store",
    })
  },
  getOperationalAgingReport(accessToken: string) {
    return requestJson<StorefrontOperationalAgingReport>("/internal/v1/ecommerce/payments/aging-report", {
      accessToken,
      cache: "no-store",
    })
  },
  getAccountingCompatibilityReport(accessToken: string) {
    return requestJson<StorefrontAccountingCompatibilityReport>(
      "/internal/v1/ecommerce/payments/accounting-compatibility-report",
      {
        accessToken,
        cache: "no-store",
      }
    )
  },
  async downloadPaymentsDailySummary(accessToken: string, days = 30) {
    const url = new URL("/internal/v1/ecommerce/payments/daily-summary-export", window.location.origin)
    url.searchParams.set("days", String(days))

    return downloadDocument(accessToken, url, "storefront-payment-daily-summary.csv")
  },
  async downloadFailedPaymentsReport(accessToken: string) {
    const url = new URL("/internal/v1/ecommerce/payments/failed-report-export", window.location.origin)

    return downloadDocument(accessToken, url, "storefront-failed-payments.csv")
  },
  async downloadRefundsReport(accessToken: string) {
    const url = new URL("/internal/v1/ecommerce/payments/refund-report-export", window.location.origin)

    return downloadDocument(accessToken, url, "storefront-refunds.csv")
  },
  async downloadSettlementGapReport(accessToken: string) {
    const url = new URL(
      "/internal/v1/ecommerce/payments/settlement-gap-report-export",
      window.location.origin
    )

    return downloadDocument(accessToken, url, "storefront-settlement-gaps.csv")
  },
  getOrdersReport(accessToken: string) {
    return requestJson<StorefrontAdminOrderOperationsReport>("/internal/v1/ecommerce/orders/report", {
      accessToken,
      cache: "no-store",
    })
  },
  getCustomersReport(accessToken: string) {
    return requestJson<StorefrontCustomerAdminReport>("/internal/v1/ecommerce/customers/report", {
      accessToken,
      cache: "no-store",
    })
  },
  getCustomerAccount(accessToken: string, customerAccountId: string) {
    const url = new URL("/internal/v1/ecommerce/customer", window.location.origin)
    url.searchParams.set("id", customerAccountId)

    return requestJson<StorefrontCustomerAdminResponse>(url.toString(), {
      accessToken,
      cache: "no-store",
    })
  },
  sendCustomerWelcomeMail(accessToken: string, customerAccountId: string) {
    return requestJson<StorefrontCustomerWelcomeMailSendResponse>(
      "/internal/v1/ecommerce/customer/send-welcome-mail",
      {
        method: "POST",
        accessToken,
        body: JSON.stringify({ customerAccountId }),
      }
    )
  },
  applyCustomerLifecycleAction(
    accessToken: string,
    payload: {
      customerAccountId: string
      action: "activate" | "block" | "mark_deleted" | "anonymize"
      note?: string | null
    }
  ) {
    return requestJson<StorefrontCustomerAdminResponse>("/internal/v1/ecommerce/customer/lifecycle", {
      method: "POST",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  markCustomerSecurityReview(
    accessToken: string,
    payload: {
      customerAccountId: string
      note?: string | null
    }
  ) {
    return requestJson<StorefrontCustomerAdminResponse>(
      "/internal/v1/ecommerce/customer/security-review",
      {
        method: "POST",
        accessToken,
        body: JSON.stringify(payload),
      }
    )
  },
  permanentlyDeleteCustomerAccount(
    accessToken: string,
    payload: {
      customerAccountId: string
      note?: string | null
    }
  ) {
    return requestJson<StorefrontCustomerPermanentDeleteResponse>(
      "/internal/v1/ecommerce/customer/permanent-delete",
      {
        method: "POST",
        accessToken,
        body: JSON.stringify(payload),
      }
    )
  },
  getAdminOrder(accessToken: string, orderId: string) {
    const url = new URL("/internal/v1/ecommerce/order", window.location.origin)
    url.searchParams.set("id", orderId)

    return requestJson<StorefrontOrderResponse>(url.toString(), {
      accessToken,
      cache: "no-store",
    })
  },
  runAdminOrderAction(
    accessToken: string,
    payload: {
      orderId: string
      action: "cancel" | "mark_fulfilment_pending" | "mark_shipped" | "mark_delivered" | "resend_confirmation"
      trackingId?: string | null
      carrierName?: string | null
      trackingUrl?: string | null
      note?: string | null
    }
  ) {
    return requestJson<StorefrontOrderResponse>("/internal/v1/ecommerce/order/action", {
      method: "POST",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  requestRefund(
    accessToken: string,
    payload: { orderId: string; amount?: number; reason?: string | null }
  ) {
    return requestJson<StorefrontOrderResponse>("/internal/v1/ecommerce/payments/refund-request", {
      method: "POST",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  updateRefundStatus(
    accessToken: string,
    payload: { orderId: string; status: "queued" | "processing" | "rejected"; reason?: string | null }
  ) {
    return requestJson<StorefrontOrderResponse>("/internal/v1/ecommerce/payments/refund-status", {
      method: "POST",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  reconcilePayments(
    accessToken: string,
    payload: { orderIds?: string[]; maxOrders?: number } = {}
  ) {
    return requestJson<StorefrontPaymentReconciliationResponse>("/internal/v1/ecommerce/payments/reconcile", {
      method: "POST",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getSupportReport(accessToken: string) {
    return requestJson<StorefrontSupportQueueReport>("/internal/v1/ecommerce/support/report", {
      accessToken,
      cache: "no-store",
    })
  },
  updateSupportCase(
    accessToken: string,
    payload: {
      caseId: string
      status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed"
      priority?: "low" | "normal" | "high" | "urgent"
      adminNote?: string | null
    }
  ) {
    return requestJson<StorefrontSupportCaseResponse>("/internal/v1/ecommerce/support/case", {
      method: "POST",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  getOrderRequestReport(accessToken: string) {
    return requestJson<StorefrontOrderRequestQueueReport>(
      "/internal/v1/ecommerce/order-requests/report",
      {
        accessToken,
        cache: "no-store",
      }
    )
  },
  reviewOrderRequest(
    accessToken: string,
    payload: {
      requestId: string
      status: "in_review" | "approved" | "rejected"
      adminNote?: string | null
    }
  ) {
    return requestJson<StorefrontOrderRequestResponse>(
      "/internal/v1/ecommerce/order-request/review",
      {
        method: "POST",
        accessToken,
        body: JSON.stringify(payload),
      }
    )
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
  getCustomerProfileLookups(accessToken: string) {
    return requestJson<CustomerProfileLookupResponse>("/api/v1/storefront/customers/me/lookups", {
      accessToken,
      cache: "no-store",
    })
  },
  getGuestCheckoutLookups() {
    return requestJson<CustomerProfileLookupResponse>("/api/v1/storefront/checkout/lookups", {
      cache: "no-store",
    })
  },
  getCustomerPortal(accessToken: string) {
    return requestJson<CustomerPortalResponse>("/api/v1/storefront/customers/me/portal", {
      accessToken,
      cache: "no-store",
    })
  },
  getCustomerSupportCases(accessToken: string) {
    return requestJson<StorefrontSupportCaseListResponse>(
      "/api/v1/storefront/customers/me/support-cases",
      {
        accessToken,
        cache: "no-store",
      }
    )
  },
  createCustomerSupportCase(
    accessToken: string,
    payload: StorefrontSupportCaseCreatePayload
  ) {
    return requestJson<StorefrontSupportCaseResponse>(
      "/api/v1/storefront/customers/me/support-cases",
      {
        method: "POST",
        accessToken,
        body: JSON.stringify(payload),
      }
    )
  },
  getCustomerOrderRequests(accessToken: string, orderId?: string | null) {
    const url = new URL("/api/v1/storefront/customers/me/order-requests", window.location.origin)

    if (orderId?.trim()) {
      url.searchParams.set("orderId", orderId)
    }

    return requestJson<StorefrontOrderRequestListResponse>(url.toString(), {
      accessToken,
      cache: "no-store",
    })
  },
  createCustomerOrderRequest(
    accessToken: string,
    payload: StorefrontOrderRequestCreatePayload
  ) {
    return requestJson<StorefrontOrderRequestResponse>(
      "/api/v1/storefront/customers/me/order-requests",
      {
        method: "POST",
        accessToken,
        body: JSON.stringify(payload),
      }
    )
  },
  updateCustomerProfile(accessToken: string, payload: CustomerProfileUpdatePayload) {
    return requestJson<CustomerProfile>("/api/v1/storefront/customers/me", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  deactivateMyCustomerAccount(accessToken: string) {
    return requestJson<StorefrontCustomerSelfDeactivateResponse>("/api/v1/storefront/customers/me", {
      method: "DELETE",
      accessToken,
    })
  },
  updateCustomerPortalPreferences(
    accessToken: string,
    payload: CustomerPortalPreferencesUpdatePayload
  ) {
    return requestJson<CustomerPortalResponse>("/api/v1/storefront/customers/me/preferences", {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    })
  },
  toggleCustomerWishlist(accessToken: string, productId: string) {
    return requestJson<CustomerPortalResponse>("/api/v1/storefront/customers/me/wishlist", {
      method: "POST",
      accessToken,
      body: JSON.stringify({ productId }),
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
  }, accessToken?: string | null) {
    return requestJson<StorefrontOrderResponse>(
      "/api/v1/storefront/checkout/payment/verify",
      {
        method: "POST",
        accessToken,
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
  async downloadCustomerOrderReceipt(accessToken: string, orderId: string) {
    const url = new URL("/api/v1/storefront/order-receipt", window.location.origin)
    url.searchParams.set("id", orderId)

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error ?? `Request failed with status ${response.status}`)
    }

    const html = await response.text()
    return {
      fileName: extractDownloadFileName(
        response.headers.get("content-disposition"),
        "storefront-receipt.html"
      ),
      blob: new Blob([html], {
        type: response.headers.get("content-type") ?? "text/html;charset=utf-8",
      }),
    }
  },
}
