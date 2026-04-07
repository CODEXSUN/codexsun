import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { createAuthService, createMailboxService } from "../../apps/cxapp/src/services/service-factory.js"
import {
  getStorefrontCatalog,
  getStorefrontLanding,
  getStorefrontLegalPage,
  getStorefrontProduct,
} from "../../apps/ecommerce/src/services/catalog-service.js"
import { ecommerceTableNames } from "../../apps/ecommerce/database/table-names.js"
import { defaultStorefrontSettings } from "../../apps/ecommerce/src/data/storefront-seed.js"
import {
  getAuthenticatedCustomer,
  getAuthenticatedCustomerPortal,
  registerCustomer,
  toggleCustomerWishlistItem,
  updateCustomerPortalPreferences,
  updateCustomerProfile,
} from "../../apps/ecommerce/src/services/customer-service.js"
import {
  getStorefrontHomeSlider,
  getStorefrontSettings,
  saveStorefrontHomeSlider,
  saveStorefrontSettings,
} from "../../apps/ecommerce/src/services/storefront-settings-service.js"
import {
  assertStorefrontMailboxTemplates,
  listStorefrontCommunicationLog,
  resendStorefrontCommunication,
} from "../../apps/ecommerce/src/services/storefront-communication-service.js"
import {
  createCheckoutOrder,
  getStorefrontPaymentOperationsReport,
  handleRazorpayWebhook,
  listCustomerOrders,
  reconcileRazorpayPayments,
  requestStorefrontRefund,
  trackOrderByReference,
  verifyCheckoutPayment,
} from "../../apps/ecommerce/src/services/order-service.js"
import { readStorefrontPaymentWebhookEvents } from "../../apps/ecommerce/src/services/storefront-webhook-event-storage.js"
import { writeStorefrontPaymentWebhookEvents } from "../../apps/ecommerce/src/services/storefront-webhook-event-storage.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"
import { getMonitoringDashboard } from "../../apps/framework/src/runtime/monitoring/monitoring-service.js"
import { replaceJsonStoreRecords } from "../../apps/framework/src/runtime/database/process/json-store.js"

test("ecommerce storefront supports customer registration, mock checkout, portal orders, and public tracking", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-services-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false

    const runtime = createRuntimeDatabases(config)
    const authRequestMeta = { ipAddress: null, userAgent: null }

    try {
      await prepareApplicationDatabase(runtime)
      const authService = createAuthService(runtime.primary, config)

      const landing = await getStorefrontLanding(runtime.primary)
      const catalog = await getStorefrontCatalog(runtime.primary, {})
      const storedSettings = await getStorefrontSettings(runtime.primary)
      const storedHomeSlider = await getStorefrontHomeSlider(runtime.primary)
      const shippingPage = await getStorefrontLegalPage(runtime.primary, "shipping")
      const product = await getStorefrontProduct(runtime.primary, {
        slug: catalog.items[0]?.slug ?? null,
      })

      assert.equal(landing.settings.hero.title.length > 0, true)
      assert.equal(storedSettings.search.departments.length > 0, true)
      assert.equal(storedHomeSlider.slides.length > 0, true)
      assert.equal(storedHomeSlider.slides[0]?.theme.themeKey.length > 0, true)
      assert.equal(shippingPage.item.sections.length > 0, true)
      assert.equal(shippingPage.item.id, "shipping")
      assert.equal(catalog.items.length > 0, true)
      assert.equal(product.item.id, catalog.items[0]?.id)
      assert.equal(landing.categories.some((item) => item.showInTopMenu), true)

      const savedSettings = await saveStorefrontSettings(runtime.primary, {
        ...storedSettings,
        announcement: "Updated storefront announcement",
        announcementDesign: {
          ...storedSettings.announcementDesign,
          iconKey: "truck",
          cornerStyle: "rounded",
          backgroundColor: "#2c1e16",
        },
      })

      assert.equal(savedSettings.announcement, "Updated storefront announcement")
      assert.equal(savedSettings.announcementDesign.iconKey, "truck")
      assert.equal(savedSettings.announcementDesign.cornerStyle, "rounded")

      const partiallySavedSettings = await saveStorefrontSettings(runtime.primary, {
        search: undefined,
        footer: {
          description: "Updated footer description",
        },
      })

      assert.equal(
        partiallySavedSettings.footer.description,
        "Updated footer description"
      )
      assert.equal(
        partiallySavedSettings.search.placeholder,
        storedSettings.search.placeholder
      )

      const savedHomeSlider = await saveStorefrontHomeSlider(runtime.primary, {
        slides: [
          {
            id: storedHomeSlider.slides[0]?.id ?? "home-slider:01",
            label: "Slider 01",
            theme: {
              themeKey: "mocha-bronze",
              backgroundFrom: "#2f1e18",
              backgroundVia: "#8a5a40",
              backgroundTo: "#efcfac",
              primaryButtonLabel: "Shop this drop",
            },
          },
          ...(storedHomeSlider.slides.slice(1) ?? []),
        ],
      })

      assert.equal(savedHomeSlider.slides[0]?.theme.themeKey, "mocha-bronze")
      assert.equal(savedHomeSlider.slides[0]?.theme.primaryButtonLabel, "Shop this drop")

      await replaceJsonStoreRecords(
        runtime.primary,
        ecommerceTableNames.storefrontSettings,
        [
          {
            id: storedSettings.id,
            payload: {
              id: storedSettings.id,
              hero: storedSettings.hero,
              announcement: storedSettings.announcement,
              supportPhone: storedSettings.supportPhone,
              supportEmail: storedSettings.supportEmail,
              freeShippingThreshold: storedSettings.freeShippingThreshold,
              defaultShippingAmount: storedSettings.defaultShippingAmount,
              createdAt: storedSettings.createdAt,
              updatedAt: storedSettings.updatedAt,
            },
          },
        ]
      )

      const hydratedLegacySettings = await getStorefrontSettings(runtime.primary)

      assert.equal(
        hydratedLegacySettings.search.placeholder,
        defaultStorefrontSettings.search.placeholder
      )
      assert.equal(
        hydratedLegacySettings.announcementDesign.iconKey,
        defaultStorefrontSettings.announcementDesign.iconKey
      )
      assert.equal(
        hydratedLegacySettings.homeSlider.slides[0]?.theme.themeKey,
        defaultStorefrontSettings.homeSlider.slides[0]?.theme.themeKey
      )

      await replaceJsonStoreRecords(
        runtime.primary,
        ecommerceTableNames.storefrontSettings,
        [
          {
            id: storedSettings.id,
            payload: {
              ...storedSettings,
              homeSlider: {
                themeKey: "walnut-glow",
                backgroundFrom: "#201611",
                backgroundVia: "#5f4334",
                backgroundTo: "#e9d6c3",
              },
            },
          },
        ]
      )

      const hydratedSingleThemeSettings = await getStorefrontSettings(runtime.primary)

      assert.equal(
        hydratedSingleThemeSettings.homeSlider.slides[0]?.theme.themeKey,
        "walnut-glow"
      )
      assert.equal(
        hydratedSingleThemeSettings.homeSlider.slides.length,
        defaultStorefrontSettings.homeSlider.slides.length
      )

      const registration = await registerCustomer(runtime.primary, config, {
        displayName: "Asha Raman",
        email: "asha@codexsun.local",
        phoneNumber: "+91 98888 77777",
        password: "Password@123",
        companyName: "",
        gstin: "",
        addressLine1: "18 River Road",
        addressLine2: "",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600001",
      })

      assert.equal(registration.email, "asha@codexsun.local")

      const customerSession = await authService.login(
        {
          email: "asha@codexsun.local",
          password: "Password@123",
        },
        authRequestMeta
      )

      const refreshedCustomer = await getAuthenticatedCustomer(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(refreshedCustomer.displayName, "Asha Raman")

      const initialPortal = await getAuthenticatedCustomerPortal(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(initialPortal.coupons.length > 0, true)
      assert.equal(initialPortal.giftCards.length > 0, true)
      assert.equal(initialPortal.rewards.pointsBalance > 0, true)
      assert.equal(initialPortal.wishlist.length, 0)

      await updateCustomerProfile(
        runtime.primary,
        config,
        customerSession.accessToken,
        {
          displayName: "Asha Raman",
          phoneNumber: "+91 98888 11111",
          companyName: "Asha Retail",
          gstin: "",
          addressLine1: "18 River Road",
          addressLine2: "Floor 2",
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        }
      )

      const updatedPortal = await updateCustomerPortalPreferences(
        runtime.primary,
        config,
        customerSession.accessToken,
        {
          smsAlerts: true,
          marketingEmails: false,
        }
      )

      assert.equal(updatedPortal.preferences.smsAlerts, true)
      assert.equal(updatedPortal.preferences.marketingEmails, false)

      const wishlistedPortal = await toggleCustomerWishlistItem(
        runtime.primary,
        config,
        customerSession.accessToken,
        {
          productId: product.item.id,
        }
      )

      assert.equal(wishlistedPortal.wishlist.length, 1)
      assert.equal(wishlistedPortal.wishlist[0]?.id, product.item.id)

      const checkout = await createCheckoutOrder(
        runtime.primary,
        config,
        {
          items: [{ productId: product.item.id, quantity: 2 }],
          shippingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          billingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          notes: null,
        },
        customerSession.accessToken
      )

      assert.equal(checkout.payment.mode, "mock")
      assert.equal(checkout.order.paymentStatus, "pending")
      assert.equal(checkout.order.status, "payment_pending")

      const duplicateCheckout = await createCheckoutOrder(
        runtime.primary,
        config,
        {
          items: [{ productId: product.item.id, quantity: 2 }],
          shippingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          billingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          notes: null,
        },
        customerSession.accessToken
      )

      assert.equal(duplicateCheckout.order.id, checkout.order.id)
      assert.equal(
        duplicateCheckout.payment.providerOrderId,
        checkout.payment.providerOrderId
      )

      const verified = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.payment.providerOrderId,
        providerPaymentId: "mock_payment_001",
        signature: "mock_signature",
      })

      assert.equal(verified.item.paymentStatus, "paid")
      assert.equal(verified.item.status, "paid")

      const verifiedAgain = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.payment.providerOrderId,
        providerPaymentId: "mock_payment_001",
        signature: "mock_signature",
      })

      assert.equal(verifiedAgain.item.id, verified.item.id)
      assert.equal(verifiedAgain.item.providerPaymentId, "mock_payment_001")
      assert.equal(
        verifiedAgain.item.timeline.filter((entry) => entry.code === "payment_captured").length,
        1
      )

      const monitoringDashboard = await getMonitoringDashboard(runtime.primary, config, {
        windowHours: 24,
      })
      const checkoutSummary = monitoringDashboard.summaries.find(
        (item) => item.operation === "checkout"
      )
      const orderCreationSummary = monitoringDashboard.summaries.find(
        (item) => item.operation === "order_creation"
      )
      const paymentVerifySummary = monitoringDashboard.summaries.find(
        (item) => item.operation === "payment_verify"
      )

      assert.equal(checkoutSummary?.successCount, 2)
      assert.equal(orderCreationSummary?.successCount, 1)
      assert.equal(paymentVerifySummary?.successCount, 2)

      const customerOrders = await listCustomerOrders(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(customerOrders.items.length, 1)
      assert.equal(customerOrders.items[0]?.orderNumber, verified.item.orderNumber)

      const tracked = await trackOrderByReference(runtime.primary, {
        orderNumber: verified.item.orderNumber,
        email: "asha@codexsun.local",
      })

      assert.equal(tracked.item.id, verified.item.id)
      assert.equal(
        tracked.item.timeline.some((entry) => entry.code === "payment_captured"),
        true
      )
      assert.equal(tracked.item.status, "paid")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("razorpay webhook verifies signatures and updates matching storefront orders idempotently", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-webhook-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false
    config.commerce.razorpay.keyId = "rzp_test_key"
    config.commerce.razorpay.keySecret = "rzp_test_secret"
    config.commerce.razorpay.webhookSecret = "rzp_webhook_secret"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const catalog = await getStorefrontCatalog(runtime.primary, {})
      const productId = catalog.items[0]?.id

      assert.ok(productId)

      const checkout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Webhook Customer",
          email: "webhook@codexsun.local",
          phoneNumber: "+919999999999",
          line1: "1 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Webhook Customer",
          email: "webhook@codexsun.local",
          phoneNumber: "+919999999999",
          line1: "1 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      config.commerce.razorpay.enabled = true

      const webhookPayload = JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_webhook_001",
              order_id: checkout.payment.providerOrderId,
              status: "captured",
              notes: {
                storefrontOrderId: checkout.order.id,
              },
            },
          },
          order: {
            entity: {
              id: checkout.payment.providerOrderId,
              receipt: checkout.order.orderNumber,
              notes: {
                storefrontOrderId: checkout.order.id,
              },
            },
          },
        },
      })

      const signature = createHmac("sha256", config.commerce.razorpay.webhookSecret)
        .update(webhookPayload)
        .digest("hex")
      const providerEventId = "evt_webhook_001"

      const processed = await handleRazorpayWebhook(runtime.primary, config, {
        bodyText: webhookPayload,
        signature,
        providerEventId,
      })

      assert.equal(processed.received, true)
      assert.equal(processed.processed, true)
      assert.equal(processed.event, "payment.captured")

      const tracked = await trackOrderByReference(runtime.primary, {
        orderNumber: checkout.order.orderNumber,
        email: "webhook@codexsun.local",
      })

      assert.equal(tracked.item.paymentStatus, "paid")
      assert.equal(tracked.item.status, "paid")
      assert.equal(tracked.item.providerPaymentId, "pay_webhook_001")
      assert.equal(
        tracked.item.timeline.filter((entry) => entry.code === "payment_captured").length,
        1
      )
      const storedEvents = await readStorefrontPaymentWebhookEvents(runtime.primary)
      assert.equal(storedEvents.length, 1)
      assert.equal(storedEvents[0]?.providerEventId, `razorpay:${providerEventId}`)
      assert.equal(storedEvents[0]?.processingStatus, "processed")
      assert.equal(storedEvents[0]?.orderId, checkout.order.id)

      const processedAgain = await handleRazorpayWebhook(runtime.primary, config, {
        bodyText: webhookPayload,
        signature,
        providerEventId,
      })

      assert.equal(processedAgain.received, true)
      assert.equal(processedAgain.processed, false)
      assert.equal(processedAgain.duplicate, true)
      assert.equal(processedAgain.reason, "already_processed")
      const storedEventsAfterReplay = await readStorefrontPaymentWebhookEvents(runtime.primary)
      assert.equal(storedEventsAfterReplay.length, 1)

      await assert.rejects(
        () =>
          handleRazorpayWebhook(runtime.primary, config, {
            bodyText: webhookPayload,
            signature: "invalid_signature",
            providerEventId: "evt_webhook_invalid",
          }),
        /signature could not be verified/i
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("razorpay reconciliation updates pending live orders using provider order payments", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-reconcile-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false
    config.commerce.razorpay.keyId = "rzp_test_key"
    config.commerce.razorpay.keySecret = "rzp_test_secret"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const catalog = await getStorefrontCatalog(runtime.primary, {})
      const productId = catalog.items[0]?.id

      assert.ok(productId)

      const checkout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Reconcile Customer",
          email: "reconcile@codexsun.local",
          phoneNumber: "+919999999998",
          line1: "2 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Reconcile Customer",
          email: "reconcile@codexsun.local",
          phoneNumber: "+919999999998",
          line1: "2 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const livePendingOrder = {
        ...checkout.order,
        paymentMode: "live" as const,
        providerOrderId: "order_live_reconcile_001",
        paymentProvider: "razorpay" as const,
        paymentStatus: "pending" as const,
        status: "payment_pending" as const,
      }

      await replaceJsonStoreRecords(runtime.primary, ecommerceTableNames.orders, [
        {
          id: livePendingOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 1,
          payload: livePendingOrder,
          createdAt: livePendingOrder.createdAt,
          updatedAt: livePendingOrder.updatedAt,
        },
      ])

      config.commerce.razorpay.enabled = true

      const originalFetch = globalThis.fetch
      globalThis.fetch = (async (input: string | URL | Request) => {
        const url = String(input)

        if (url.includes("/v1/orders/order_live_reconcile_001/payments")) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: "pay_reconcile_001",
                  order_id: "order_live_reconcile_001",
                  status: "captured",
                  amount_refunded: 0,
                },
              ],
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            }
          )
        }

        throw new Error(`Unexpected fetch URL: ${url}`)
      }) as typeof fetch

      try {
        const reconciled = await reconcileRazorpayPayments(runtime.primary, config, {
          maxOrders: 10,
        })

        assert.equal(reconciled.processedCount, 1)
        assert.equal(reconciled.matchedCount, 1)
        assert.equal(reconciled.updatedCount, 1)
        assert.equal(reconciled.items[0]?.action, "paid")

        const tracked = await trackOrderByReference(runtime.primary, {
          orderNumber: livePendingOrder.orderNumber,
          email: "reconcile@codexsun.local",
        })

        assert.equal(tracked.item.paymentStatus, "paid")
        assert.equal(tracked.item.status, "paid")
        assert.equal(tracked.item.providerPaymentId, "pay_reconcile_001")
        assert.equal(
          tracked.item.timeline.some((entry) => entry.code === "payment_captured"),
          true
        )
      } finally {
        globalThis.fetch = originalFetch
      }
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("payment operations report groups settlement queue and payment exceptions", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-payments-report-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const catalog = await getStorefrontCatalog(runtime.primary, {})
      const productId = catalog.items[0]?.id

      assert.ok(productId)

      const paidCheckout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Paid Customer",
          email: "paid@codexsun.local",
          phoneNumber: "+919999999997",
          line1: "3 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Paid Customer",
          email: "paid@codexsun.local",
          phoneNumber: "+919999999997",
          line1: "3 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const failedCheckout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Failed Customer",
          email: "failed@codexsun.local",
          phoneNumber: "+919999999996",
          line1: "4 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Failed Customer",
          email: "failed@codexsun.local",
          phoneNumber: "+919999999996",
          line1: "4 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const pendingCheckout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Pending Customer",
          email: "pending@codexsun.local",
          phoneNumber: "+919999999995",
          line1: "5 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Pending Customer",
          email: "pending@codexsun.local",
          phoneNumber: "+919999999995",
          line1: "5 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const timestamp = new Date().toISOString()
      const paidOrder = {
        ...paidCheckout.order,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        paymentStatus: "paid" as const,
        status: "paid" as const,
        providerOrderId: "order_live_paid_001",
        providerPaymentId: "pay_live_paid_001",
        timeline: [
          ...paidCheckout.order.timeline,
          {
            id: "timeline:paid-report",
            code: "payment_captured",
            label: "Payment captured",
            summary: "Payment captured for reporting coverage.",
            createdAt: timestamp,
          },
        ],
        updatedAt: timestamp,
      }
      const failedOrder = {
        ...failedCheckout.order,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        paymentStatus: "failed" as const,
        status: "payment_pending" as const,
        providerOrderId: "order_live_failed_001",
        providerPaymentId: "pay_live_failed_001",
        timeline: [
          ...failedCheckout.order.timeline,
          {
            id: "timeline:failed-report",
            code: "payment_failed",
            label: "Payment failed",
            summary: "Payment failed for reporting coverage.",
            createdAt: timestamp,
          },
        ],
        updatedAt: timestamp,
      }
      const pendingOrder = {
        ...pendingCheckout.order,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        paymentStatus: "pending" as const,
        status: "payment_pending" as const,
        providerOrderId: "order_live_pending_001",
        updatedAt: timestamp,
      }

      await replaceJsonStoreRecords(runtime.primary, ecommerceTableNames.orders, [
        {
          id: paidOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 1,
          payload: paidOrder,
          createdAt: paidOrder.createdAt,
          updatedAt: paidOrder.updatedAt,
        },
        {
          id: failedOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 2,
          payload: failedOrder,
          createdAt: failedOrder.createdAt,
          updatedAt: failedOrder.updatedAt,
        },
        {
          id: pendingOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 3,
          payload: pendingOrder,
          createdAt: pendingOrder.createdAt,
          updatedAt: pendingOrder.updatedAt,
        },
      ])

      await writeStorefrontPaymentWebhookEvents(runtime.primary, [
        {
          id: "storefront-payment-webhook:ignored-report",
          provider: "razorpay",
          providerEventId: "razorpay:evt_ignored_report",
          eventType: "payment.failed",
          signature: "report_signature",
          orderId: null,
          providerOrderId: "order_missing_001",
          providerPaymentId: "pay_missing_001",
          processingStatus: "ignored",
          processingSummary: "No matching storefront order was found for this webhook event.",
          payloadBody: "{\"event\":\"payment.failed\"}",
          receivedAt: timestamp,
          processedAt: timestamp,
          updatedAt: timestamp,
        },
      ])

      const report = await getStorefrontPaymentOperationsReport(runtime.primary)

      assert.equal(report.summary.livePaymentOrderCount, 3)
      assert.equal(report.summary.settlementPendingCount, 1)
      assert.equal(report.summary.failedPaymentCount, 1)
      assert.equal(report.summary.paymentPendingCount, 1)
      assert.equal(report.summary.webhookExceptionCount, 1)
      assert.equal(report.settlementQueue[0]?.orderId, paidOrder.id)
      assert.equal(report.failedPayments.length, 2)
      assert.equal(
        report.failedPayments.some((item) => item.orderId === failedOrder.id && item.paymentStatus === "failed"),
        true
      )
      assert.equal(
        report.failedPayments.some((item) => item.orderId === pendingOrder.id && item.paymentStatus === "pending"),
        true
      )
      assert.equal(report.webhookExceptions[0]?.providerEventId, "razorpay:evt_ignored_report")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("refund initiation records refund metadata and refund webhook completes it", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-refund-model-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false
    config.commerce.razorpay.keyId = "rzp_test_key"
    config.commerce.razorpay.keySecret = "rzp_test_secret"
    config.commerce.razorpay.webhookSecret = "rzp_webhook_secret"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const catalog = await getStorefrontCatalog(runtime.primary, {})
      const productId = catalog.items[0]?.id

      assert.ok(productId)

      const checkout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Refund Customer",
          email: "refund@codexsun.local",
          phoneNumber: "+919999999994",
          line1: "6 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Refund Customer",
          email: "refund@codexsun.local",
          phoneNumber: "+919999999994",
          line1: "6 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const verified = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.payment.providerOrderId,
        providerPaymentId: "pay_refund_model_001",
        signature: "mock_signature",
      })

      const livePaidOrder = {
        ...verified.item,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        providerOrderId: "order_live_refund_001",
        providerPaymentId: "pay_refund_model_001",
      }

      await replaceJsonStoreRecords(runtime.primary, ecommerceTableNames.orders, [
        {
          id: livePaidOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 1,
          payload: livePaidOrder,
          createdAt: livePaidOrder.createdAt,
          updatedAt: livePaidOrder.updatedAt,
        },
      ])

      const requestedRefund = await requestStorefrontRefund(runtime.primary, {
        orderId: livePaidOrder.id,
        reason: "Customer returned the product.",
      })

      assert.equal(requestedRefund.item.refund?.status, "requested")
      assert.equal(requestedRefund.item.refund?.type, "full")
      assert.equal(requestedRefund.item.refund?.requestedBy, "admin")
      assert.equal(requestedRefund.item.refund?.requestedAmount, livePaidOrder.totalAmount)
      assert.equal(
        requestedRefund.item.timeline.some((entry) => entry.code === "refund_requested"),
        true
      )

      config.commerce.razorpay.enabled = true

      const webhookPayload = JSON.stringify({
        event: "refund.processed",
        payload: {
          refund: {
            entity: {
              id: "rfnd_001",
              payment_id: "pay_refund_model_001",
              notes: {
                storefrontOrderId: livePaidOrder.id,
              },
            },
          },
          payment: {
            entity: {
              id: "pay_refund_model_001",
              order_id: "order_live_refund_001",
              status: "refunded",
              notes: {
                storefrontOrderId: livePaidOrder.id,
              },
            },
          },
          order: {
            entity: {
              id: "order_live_refund_001",
              receipt: livePaidOrder.orderNumber,
              notes: {
                storefrontOrderId: livePaidOrder.id,
              },
            },
          },
        },
      })

      const signature = createHmac("sha256", config.commerce.razorpay.webhookSecret)
        .update(webhookPayload)
        .digest("hex")

      const refunded = await handleRazorpayWebhook(runtime.primary, config, {
        bodyText: webhookPayload,
        signature,
        providerEventId: "evt_refund_model_001",
      })

      assert.equal(refunded.processed, true)

      const tracked = await trackOrderByReference(runtime.primary, {
        orderNumber: livePaidOrder.orderNumber,
        email: "refund@codexsun.local",
      })

      assert.equal(tracked.item.status, "refunded")
      assert.equal(tracked.item.paymentStatus, "refunded")
      assert.equal(tracked.item.refund?.status, "refunded")
      assert.equal(tracked.item.refund?.providerRefundId, "rfnd_001")
      assert.equal(
        tracked.item.refund?.reason,
        "Customer returned the product."
      )
      assert.equal(
        tracked.item.timeline.some((entry) => entry.code === "payment_refunded"),
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("storefront communications validate template readiness and log failed payment mail activity", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-communications-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false
    config.commerce.razorpay.keyId = "rzp_test_key"
    config.commerce.razorpay.keySecret = "rzp_test_secret"
    config.commerce.razorpay.webhookSecret = "rzp_webhook_secret"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const readiness = await assertStorefrontMailboxTemplates(runtime.primary)
      assert.equal(readiness.ready, true)
      assert.equal(readiness.checkedTemplateCodes.includes("storefront_payment_failed"), true)
      const mailboxService = createMailboxService(runtime.primary, config)
      const templates = await mailboxService.listTemplates(true)
      const orderConfirmedTemplate = templates.items.find(
        (item) => item.code === "storefront_order_confirmed"
      )
      const paymentFailedTemplate = templates.items.find(
        (item) => item.code === "storefront_payment_failed"
      )
      const welcomeTemplate = templates.items.find(
        (item) => item.code === "storefront_customer_welcome"
      )

      assert.ok(orderConfirmedTemplate)
      assert.ok(paymentFailedTemplate)
      assert.ok(welcomeTemplate)

      const orderConfirmedDetail = await mailboxService.getTemplateById(orderConfirmedTemplate.id)
      const paymentFailedDetail = await mailboxService.getTemplateById(paymentFailedTemplate.id)

      assert.match(orderConfirmedDetail.item.subjectTemplate, /\{\{orderNumber\}\}/)
      assert.match(orderConfirmedDetail.item.htmlTemplate ?? "", /\{\{orderItemsHtml\}\}/)
      assert.match(orderConfirmedDetail.item.htmlTemplate ?? "", /\{\{supportEmail\}\}/)
      assert.match(paymentFailedDetail.item.subjectTemplate, /\{\{orderNumber\}\}/)
      assert.match(paymentFailedDetail.item.htmlTemplate ?? "", /\{\{checkoutUrl\}\}/)
      assert.match(paymentFailedDetail.item.textTemplate ?? "", /Support: \{\{supportEmail\}\}/)

      const catalog = await getStorefrontCatalog(runtime.primary, {})
      const productId = catalog.items[0]?.id

      assert.ok(productId)

      const checkout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Failure Mail Customer",
          email: "failure-mail@codexsun.local",
          phoneNumber: "+919999999993",
          line1: "7 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Failure Mail Customer",
          email: "failure-mail@codexsun.local",
          phoneNumber: "+919999999993",
          line1: "7 Commerce Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const livePendingOrder = {
        ...checkout.order,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        paymentStatus: "pending" as const,
        status: "payment_pending" as const,
        providerOrderId: "order_live_failed_mail_001",
      }

      await replaceJsonStoreRecords(runtime.primary, ecommerceTableNames.orders, [
        {
          id: livePendingOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 1,
          payload: livePendingOrder,
          createdAt: livePendingOrder.createdAt,
          updatedAt: livePendingOrder.updatedAt,
        },
      ])

      config.commerce.razorpay.enabled = true

      const webhookPayload = JSON.stringify({
        event: "payment.failed",
        payload: {
          payment: {
            entity: {
              id: "pay_failed_mail_001",
              order_id: "order_live_failed_mail_001",
              status: "failed",
              error_description: "The bank declined the payment.",
              notes: {
                storefrontOrderId: livePendingOrder.id,
              },
            },
          },
          order: {
            entity: {
              id: "order_live_failed_mail_001",
              receipt: livePendingOrder.orderNumber,
              notes: {
                storefrontOrderId: livePendingOrder.id,
              },
            },
          },
        },
      })

      const signature = createHmac("sha256", config.commerce.razorpay.webhookSecret)
        .update(webhookPayload)
        .digest("hex")

      await handleRazorpayWebhook(runtime.primary, config, {
        bodyText: webhookPayload,
        signature,
        providerEventId: "evt_failed_mail_001",
      })

      const communicationLog = await listStorefrontCommunicationLog(runtime.primary, {
        orderId: livePendingOrder.id,
      })

      assert.equal(communicationLog.items.length >= 1, true)
      assert.equal(
        communicationLog.items.some(
          (item) =>
            item.templateCode === "storefront_payment_failed" &&
            item.referenceId === livePendingOrder.id
        ),
        true
      )

      const resent = await resendStorefrontCommunication(runtime.primary, config, {
        templateCode: "storefront_payment_failed",
        orderId: livePendingOrder.id,
      })

      assert.equal(resent.referenceId, livePendingOrder.id)
      assert.equal(resent.deliveryStatus, "failed")

      const communicationLogAfterResend = await listStorefrontCommunicationLog(runtime.primary, {
        orderId: livePendingOrder.id,
      })

      assert.equal(
        communicationLogAfterResend.items.filter((item) => item.templateCode === "storefront_payment_failed").length >= 2,
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
