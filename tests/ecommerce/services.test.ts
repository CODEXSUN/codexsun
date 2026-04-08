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
  applyStorefrontCustomerLifecycleAction,
  getAuthenticatedCustomer,
  getAuthenticatedCustomerPortal,
  getStorefrontCustomerAccount,
  getStorefrontCustomerOperationsReport,
  markStorefrontCustomerSecurityReview,
  registerCustomer,
  toggleCustomerWishlistItem,
  updateCustomerPortalPreferences,
  updateCustomerProfile,
} from "../../apps/ecommerce/src/services/customer-service.js"
import {
  createCustomerSupportCase,
  getStorefrontSupportQueueReport,
  listCustomerSupportCases,
  updateStorefrontSupportCase,
} from "../../apps/ecommerce/src/services/storefront-support-service.js"
import {
  createCustomerOrderRequest,
  getStorefrontOrderRequestQueueReport,
  listCustomerOrderRequests,
  reviewStorefrontOrderRequest,
} from "../../apps/ecommerce/src/services/storefront-order-request-service.js"
import {
  getStorefrontHomeSlider,
  getStorefrontDesignerSettings,
  getStorefrontSettings,
  getStorefrontSettingsWorkflowStatus,
  getStorefrontSettingsVersionHistory,
  publishStorefrontSettingsDraft,
  rollbackStorefrontSettings,
  saveStorefrontHomeSlider,
  saveStorefrontSettings,
} from "../../apps/ecommerce/src/services/storefront-settings-service.js"
import {
  assertStorefrontMailboxTemplates,
  listCustomerCommunicationLog,
  listStorefrontCommunicationLog,
  resendStorefrontCommunication,
} from "../../apps/ecommerce/src/services/storefront-communication-service.js"
import {
  applyStorefrontAdminOrderAction,
  createCheckoutOrder,
  getStorefrontAdminOrder,
  getStorefrontAdminOrderOperationsReport,
  getCustomerOrderReceiptDocument,
  getStorefrontFailedPaymentReportDocument,
  getStorefrontPaymentDailySummaryDocument,
  getStorefrontAccountingCompatibilityReport,
  getStorefrontOperationalAgingReport,
  getStorefrontOverviewKpiReport,
  getStorefrontPaymentOperationsReport,
  getStorefrontRefundReportDocument,
  getStorefrontSettlementGapReportDocument,
  handleRazorpayWebhook,
  listCustomerOrders,
  reconcileRazorpayPayments,
  requestStorefrontRefund,
  updateStorefrontRefundStatus,
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
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../apps/framework/src/runtime/database/process/json-store.js"

async function registerVerifiedCustomer(
  runtime: ReturnType<typeof createRuntimeDatabases>,
  config: ReturnType<typeof getServerConfig>,
  payload: Omit<
    Parameters<typeof registerCustomer>[2] extends infer T ? T & Record<string, unknown> : never,
    "emailVerificationId"
  >
) {
  const authService = createAuthService(runtime.primary, config)
  const previousEmailEnabled = config.notifications.email.enabled
  const previousOtpDebug = config.auth.otpDebug

  config.notifications.email.enabled = false
  config.auth.otpDebug = true

  try {
    const verification = await authService.requestRegisterOtp({
      channel: "email",
      actorType: "customer",
      destination: String(payload.email ?? ""),
      displayName: String(payload.displayName ?? ""),
    })

    await authService.verifyRegisterOtp({
      verificationId: verification.verificationId,
      otp: verification.debugOtp ?? "000000",
    })

    return registerCustomer(runtime.primary, config, {
      ...payload,
      emailVerificationId: verification.verificationId,
    })
  } finally {
    config.notifications.email.enabled = previousEmailEnabled
    config.auth.otpDebug = previousOtpDebug
  }
}

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
      assert.equal(storedSettings.shippingMethods.length > 0, true)
      assert.equal(storedSettings.shippingMethods.some((item) => item.isDefault), true)
      assert.equal(storedSettings.shippingZones.length > 0, true)
      assert.equal(storedSettings.shippingZones.some((item) => item.isDefault), true)
      assert.equal(storedHomeSlider.slides.length > 0, true)
      assert.equal(storedHomeSlider.slides[0]?.theme.themeKey.length > 0, true)
      assert.equal(shippingPage.item.sections.length > 0, true)
      assert.equal(shippingPage.item.id, "shipping")
      assert.equal(catalog.items.length > 0, true)
      assert.equal(product.item.id, catalog.items[0]?.id)
      assert.equal(landing.categories.some((item) => item.showInTopMenu), true)

      const savedSettings = await saveStorefrontSettings(runtime.primary, {
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
      assert.equal(savedSettings.shippingMethods.length > 0, true)
      assert.equal((await getStorefrontSettings(runtime.primary)).announcement, storedSettings.announcement)
      assert.equal(
        (await getStorefrontDesignerSettings(runtime.primary)).announcement,
        "Updated storefront announcement"
      )

      const partiallySavedSettings = await saveStorefrontSettings(runtime.primary, {
        search: undefined,
        footer: {
          description: "Updated footer description",
        },
        shippingMethods: [
          {
            ...storedSettings.shippingMethods[0],
            label: "Updated delivery method",
            courierName: "DTDC Express",
          },
          ...storedSettings.shippingMethods.slice(1),
        ],
        shippingZones: [
          {
            ...storedSettings.shippingZones[0],
            label: "Updated metro zone",
            shippingSurchargeAmount: 25,
          },
          ...storedSettings.shippingZones.slice(1),
        ],
      })

      assert.equal(
        partiallySavedSettings.footer.description,
        "Updated footer description"
      )
      assert.equal(
        partiallySavedSettings.search.placeholder,
        storedSettings.search.placeholder
      )
      assert.equal(partiallySavedSettings.shippingMethods[0]?.label, "Updated delivery method")
      assert.equal(partiallySavedSettings.shippingMethods[0]?.courierName, "DTDC Express")
      assert.equal(partiallySavedSettings.shippingZones[0]?.label, "Updated metro zone")
      assert.equal(partiallySavedSettings.shippingZones[0]?.shippingSurchargeAmount, 25)

      const workflowBeforePublish = await getStorefrontSettingsWorkflowStatus(runtime.primary)
      assert.equal(workflowBeforePublish.hasDraft, true)
      assert.equal(workflowBeforePublish.hasUnpublishedChanges, true)
      assert.equal(
        workflowBeforePublish.previewSettings.footer.description,
        "Updated footer description"
      )

      const publishedWorkflow = await publishStorefrontSettingsDraft(runtime.primary)
      assert.equal(publishedWorkflow.hasDraft, false)
      assert.equal(publishedWorkflow.hasUnpublishedChanges, false)
      assert.equal(
        (await getStorefrontSettings(runtime.primary)).footer.description,
        "Updated footer description"
      )

      const storefrontRevisions = await listJsonStorePayloads<{
        snapshot: { announcement: string; updatedAt: string }
        snapshotUpdatedAt: string
        source: string
      }>(runtime.primary, ecommerceTableNames.storefrontSettingsRevisions)

      assert.equal(storefrontRevisions.length >= 1, true)
      assert.equal(storefrontRevisions[0]?.source, "publish")

      const versionHistory = await getStorefrontSettingsVersionHistory(runtime.primary)
      assert.equal(versionHistory.settings.length >= 2, true)
      assert.equal(versionHistory.settings[0]?.source, "current_live")
      assert.equal(versionHistory.homeSlider.length >= 1, true)

      await saveStorefrontSettings(runtime.primary, {
        announcement: "Rollback candidate announcement",
      })
      await rollbackStorefrontSettings(runtime.primary, {
        revisionId: storefrontRevisions[0]?.id ?? null,
      })
      assert.equal(
        (await getStorefrontSettings(runtime.primary)).announcement,
        "Updated storefront announcement"
      )

      await assert.rejects(
        () =>
          saveStorefrontSettings(runtime.primary, {
            couponBanner: {
              ...storedSettings.couponBanner,
              buttonHref: "javascript:alert('xss')",
            },
          }),
        /Link must be a relative path, anchor, or valid http\/mailto\/tel URL\./
      )

      await assert.rejects(
        () =>
          saveStorefrontSettings(runtime.primary, {
            giftCorner: {
              ...storedSettings.giftCorner,
              imageUrl: "ftp://example.com/bad-image.png",
            },
          }),
        /Media reference must be a root-relative asset path or valid http\/https URL\./
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

      const registration = await registerVerifiedCustomer(runtime, config, {
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
      const welcomeCoupon = initialPortal.coupons[0]!
      const shippingCoupon = initialPortal.coupons[1]!

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
      const initialAvailableQuantity = product.item.availableQuantity

      const checkout = await createCheckoutOrder(
        runtime.primary,
        config,
        {
          items: [{ productId: product.item.id, quantity: 2 }],
          shippingMethodId: "priority",
          couponCode: welcomeCoupon.code,
          shippingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
            pincode: "400001",
          },
          billingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
            pincode: "400001",
          },
          notes: null,
        },
        customerSession.accessToken
      )

      assert.equal(checkout.payment.mode, "mock")
      assert.equal(checkout.order.paymentStatus, "pending")
      assert.equal(checkout.order.status, "payment_pending")
      assert.equal(checkout.order.appliedCoupon?.code, welcomeCoupon.code)
      assert.equal(checkout.order.appliedCoupon?.status, "reserved")
      assert.equal(checkout.order.stockReservation?.status, "active")
      assert.equal(checkout.order.shippingMethod?.id, "priority")
      assert.equal(checkout.order.shippingMethod?.courierName, "Blue Dart Express")
      assert.equal(checkout.order.shippingZone?.id, "national-default")
      assert.equal(checkout.order.shippingAmount, 289)
      assert.equal(checkout.order.handlingAmount, 99)
      assert.equal(checkout.order.taxBreakdown?.regime, "inter_state")
      assert.equal(checkout.order.taxBreakdown?.sellerState, "Tamil Nadu")
      assert.equal(checkout.order.taxBreakdown?.customerState, "Maharashtra")
      assert.equal((checkout.order.taxBreakdown?.igstAmount ?? 0) > 0, true)
      assert.equal(
        checkout.order.stockReservation?.items.reduce((sum, item) => sum + item.quantity, 0),
        2
      )

      const reservedProduct = await getStorefrontProduct(runtime.primary, {
        slug: product.item.slug,
      })

      assert.equal(reservedProduct.item.availableQuantity, initialAvailableQuantity - 2)

      const duplicateCheckout = await createCheckoutOrder(
        runtime.primary,
        config,
        {
          items: [{ productId: product.item.id, quantity: 2 }],
          shippingMethodId: "priority",
          couponCode: welcomeCoupon.code,
          shippingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
            pincode: "400001",
          },
          billingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
            pincode: "400001",
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

      const duplicateReservedProduct = await getStorefrontProduct(runtime.primary, {
        slug: product.item.slug,
      })

      assert.equal(duplicateReservedProduct.item.availableQuantity, initialAvailableQuantity - 2)

      const pendingOrderQueue = await getStorefrontAdminOrderOperationsReport(runtime.primary)
      const pendingQueueItem = pendingOrderQueue.items.find(
        (item) => item.orderId === checkout.order.id
      )

      assert.equal(pendingOrderQueue.summary.actionRequiredCount > 0, true)
      assert.equal(pendingQueueItem?.queueBucket, "payment_attention")

      const verified = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.payment.providerOrderId,
        providerPaymentId: "mock_payment_001",
        signature: "mock_signature",
      })

      assert.equal(verified.item.paymentStatus, "paid")
      assert.equal(verified.item.status, "paid")
      assert.equal(verified.item.appliedCoupon?.status, "used")

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

      const paidOrderQueue = await getStorefrontAdminOrderOperationsReport(runtime.primary)
      const paidQueueItem = paidOrderQueue.items.find((item) => item.orderId === checkout.order.id)

      assert.equal(paidQueueItem?.queueBucket, "fulfilment")
      assert.equal(paidQueueItem?.paymentStatus, "paid")

      const markedFulfilment = await applyStorefrontAdminOrderAction(runtime.primary, config, {
        orderId: checkout.order.id,
        action: "mark_fulfilment_pending",
        note: "Packed and ready for courier allocation.",
      })

      assert.equal(markedFulfilment.item.status, "fulfilment_pending")
      assert.equal(markedFulfilment.item.shipmentDetails?.note, "Packed and ready for courier allocation.")

      const markedShipped = await applyStorefrontAdminOrderAction(runtime.primary, config, {
        orderId: checkout.order.id,
        action: "mark_shipped",
        carrierName: "Delhivery",
        trackingId: "DLV-001",
        trackingUrl: "https://tracking.example.com/DLV-001",
        note: "Handed to line-haul courier.",
      })

      assert.equal(markedShipped.item.status, "shipped")
      assert.equal(markedShipped.item.shipmentDetails?.trackingId, "DLV-001")
      assert.equal(markedShipped.item.shipmentDetails?.carrierName, "Delhivery")

      const markedDelivered = await applyStorefrontAdminOrderAction(runtime.primary, config, {
        orderId: checkout.order.id,
        action: "mark_delivered",
        note: "Customer accepted the shipment.",
      })

      assert.equal(markedDelivered.item.status, "delivered")
      assert.equal(Boolean(markedDelivered.item.shipmentDetails?.deliveredAt), true)

      const adminOrderDetail = await getStorefrontAdminOrder(runtime.primary, checkout.order.id)

      assert.equal(adminOrderDetail.item.id, checkout.order.id)
      assert.equal(adminOrderDetail.item.shipmentDetails?.trackingUrl, "https://tracking.example.com/DLV-001")

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

      const receiptDocument = await getCustomerOrderReceiptDocument(
        runtime.primary,
        config,
        customerSession.accessToken,
        verified.item.id
      )

      assert.match(receiptDocument.fileName, /html$/)
      assert.match(receiptDocument.html, new RegExp(verified.item.orderNumber))
      assert.match(receiptDocument.html, /Storefront receipt/)
      assert.match(receiptDocument.html, /GST review/)
      assert.match(receiptDocument.html, /IGST/)

      const accountingCompatibilityReport = await getStorefrontAccountingCompatibilityReport(
        runtime.primary
      )
      const compatibilityItem = accountingCompatibilityReport.items.find(
        (item) => item.orderId === verified.item.id
      )

      assert.equal(accountingCompatibilityReport.summary.reviewedOrderCount > 0, true)
      assert.equal(compatibilityItem?.status, "manual_review")
      assert.equal(
        compatibilityItem?.issueCodes.includes("shipping_tax_treatment_pending"),
        true
      )
      assert.equal(
        compatibilityItem?.issueCodes.includes("handling_tax_treatment_pending"),
        true
      )
      assert.equal(compatibilityItem?.suggestedSupplyType, "inter")

      const tracked = await trackOrderByReference(runtime.primary, {
        orderNumber: verified.item.orderNumber,
        email: "asha@codexsun.local",
      })

      assert.equal(tracked.item.id, verified.item.id)
      assert.equal(
        tracked.item.timeline.some((entry) => entry.code === "payment_captured"),
        true
      )
      assert.equal(tracked.item.status, "delivered")

      const portalAfterPaidCoupon = await getAuthenticatedCustomerPortal(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(
        portalAfterPaidCoupon.coupons.find((coupon) => coupon.id === welcomeCoupon.id)?.status,
        "used"
      )

      const secondCheckout = await createCheckoutOrder(
        runtime.primary,
        config,
        {
          items: [{ productId: product.item.id, quantity: 2 }],
          couponCode: shippingCoupon.code,
          shippingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Agartala",
            state: "Tripura",
            country: "India",
            pincode: "799001",
          },
          billingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Agartala",
            state: "Tripura",
            country: "India",
            pincode: "799001",
          },
          notes: "Second pending order",
        },
        customerSession.accessToken
      )

      assert.equal(secondCheckout.order.stockReservation?.status, "active")
      assert.equal(secondCheckout.order.appliedCoupon?.code, shippingCoupon.code)
      assert.equal(secondCheckout.order.appliedCoupon?.status, "reserved")

      const reservedTwiceProduct = await getStorefrontProduct(runtime.primary, {
        slug: product.item.slug,
      })

      assert.equal(reservedTwiceProduct.item.availableQuantity, initialAvailableQuantity - 4)

      const cancelledSecondCheckout = await applyStorefrontAdminOrderAction(runtime.primary, config, {
        orderId: secondCheckout.order.id,
        action: "cancel",
        note: "Customer did not finish payment.",
      })

      assert.equal(cancelledSecondCheckout.item.status, "cancelled")
      assert.equal(cancelledSecondCheckout.item.stockReservation?.status, "released")
      assert.equal(cancelledSecondCheckout.item.appliedCoupon?.status, "released")
      assert.equal(
        cancelledSecondCheckout.item.stockReservation?.releaseReason,
        "order_cancelled"
      )

      const portalAfterCancelledCoupon = await getAuthenticatedCustomerPortal(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(
        portalAfterCancelledCoupon.coupons.find((coupon) => coupon.id === shippingCoupon.id)?.status,
        "active"
      )

      const releasedProduct = await getStorefrontProduct(runtime.primary, {
        slug: product.item.slug,
      })

      assert.equal(releasedProduct.item.availableQuantity, initialAvailableQuantity - 2)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("storefront customer support cases link portal requests to orders and admin queue updates", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-support-cases-"))

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
      const catalog = await getStorefrontCatalog(runtime.primary, {})
      const productId = catalog.items[0]?.id

      assert.ok(productId)

      await registerVerifiedCustomer(runtime, config, {
        displayName: "Support Customer",
        email: "support@codexsun.local",
        phoneNumber: "+91 97777 22222",
        password: "Password@123",
        companyName: "",
        gstin: "",
        addressLine1: "11 Market Road",
        addressLine2: "",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600001",
      })

      const customerSession = await authService.login(
        {
          email: "support@codexsun.local",
          password: "Password@123",
        },
        authRequestMeta
      )

      const checkout = await createCheckoutOrder(
        runtime.primary,
        config,
        {
          items: [{ productId, quantity: 1 }],
          shippingAddress: {
            fullName: "Support Customer",
            email: "support@codexsun.local",
            phoneNumber: "+91 97777 22222",
            line1: "11 Market Road",
            line2: null,
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          billingAddress: {
            fullName: "Support Customer",
            email: "support@codexsun.local",
            phoneNumber: "+91 97777 22222",
            line1: "11 Market Road",
            line2: null,
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          notes: null,
        },
        customerSession.accessToken
      )

      const verified = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.payment.providerOrderId,
        providerPaymentId: "pay_support_case_001",
        signature: "mock_signature",
      })

      const createdCase = await createCustomerSupportCase(
        runtime.primary,
        config,
        customerSession.accessToken,
        {
          orderId: verified.item.id,
          category: "shipment",
          priority: "high",
          subject: "Shipment update needed",
          message: "Please confirm whether the parcel can still be redirected before dispatch.",
        }
      )

      assert.equal(createdCase.item.orderId, verified.item.id)
      assert.equal(createdCase.item.orderNumber, verified.item.orderNumber)
      assert.equal(createdCase.item.status, "open")

      const customerCases = await listCustomerSupportCases(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(customerCases.items.length, 1)
      assert.equal(customerCases.items[0]?.caseNumber, createdCase.item.caseNumber)
      assert.equal(customerCases.items[0]?.orderStatus, "paid")

      const queueReport = await getStorefrontSupportQueueReport(runtime.primary)

      assert.equal(queueReport.summary.totalCases, 1)
      assert.equal(queueReport.summary.openCount, 1)
      assert.equal(queueReport.items[0]?.customerEmail, "support@codexsun.local")

      const updatedCase = await updateStorefrontSupportCase(runtime.primary, {
        caseId: createdCase.item.id,
        status: "in_progress",
        adminNote: "Ops team is checking courier reassignment now.",
      })

      assert.equal(updatedCase.item.status, "in_progress")
      assert.equal(updatedCase.item.adminNote, "Ops team is checking courier reassignment now.")

      const resolvedCase = await updateStorefrontSupportCase(runtime.primary, {
        caseId: createdCase.item.id,
        status: "resolved",
        priority: "normal",
        adminNote: "Redirection approved and customer informed.",
      })

      assert.equal(resolvedCase.item.status, "resolved")
      assert.equal(resolvedCase.item.priority, "normal")
      assert.equal(Boolean(resolvedCase.item.resolvedAt), true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("customer cancellation and return requests flow through review and order operations", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-order-requests-"))

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
      const catalog = await getStorefrontCatalog(runtime.primary, {})
      const productId = catalog.items[0]?.id

      assert.ok(productId)

      await registerVerifiedCustomer(runtime, config, {
        displayName: "Request Customer",
        email: "requests@codexsun.local",
        phoneNumber: "+91 96666 22222",
        password: "Password@123",
        companyName: "",
        gstin: "",
        addressLine1: "14 Market Road",
        addressLine2: "",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600001",
      })

      const customerSession = await authService.login(
        {
          email: "requests@codexsun.local",
          password: "Password@123",
        },
        authRequestMeta
      )

      const cancellationCheckout = await createCheckoutOrder(
        runtime.primary,
        config,
        {
          items: [{ productId, quantity: 1 }],
          shippingAddress: {
            fullName: "Request Customer",
            email: "requests@codexsun.local",
            phoneNumber: "+91 96666 22222",
            line1: "14 Market Road",
            line2: null,
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          billingAddress: {
            fullName: "Request Customer",
            email: "requests@codexsun.local",
            phoneNumber: "+91 96666 22222",
            line1: "14 Market Road",
            line2: null,
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          notes: null,
        },
        customerSession.accessToken
      )

      const paidCancellationOrder = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: cancellationCheckout.order.id,
        providerOrderId: cancellationCheckout.payment.providerOrderId,
        providerPaymentId: "pay_cancel_request_001",
        signature: "mock_signature",
      })

      const cancellationRequest = await createCustomerOrderRequest(
        runtime.primary,
        config,
        customerSession.accessToken,
        {
          orderId: paidCancellationOrder.item.id,
          type: "cancellation",
          reason: "Need to stop this order before dispatch due to a quantity mistake.",
        }
      )

      assert.equal(cancellationRequest.item.status, "requested")
      assert.equal(cancellationRequest.item.type, "cancellation")

      const inReviewCancellation = await reviewStorefrontOrderRequest(runtime.primary, config, {
        requestId: cancellationRequest.item.id,
        status: "in_review",
        adminNote: "Reviewing dispatch hold with operations.",
      })

      assert.equal(inReviewCancellation.item.status, "in_review")

      const approvedCancellation = await reviewStorefrontOrderRequest(runtime.primary, config, {
        requestId: cancellationRequest.item.id,
        status: "approved",
        adminNote: "Cancellation approved before dispatch.",
      })

      assert.equal(approvedCancellation.item.status, "approved")

      const cancelledOrder = await getStorefrontAdminOrder(
        runtime.primary,
        paidCancellationOrder.item.id
      )

      assert.equal(cancelledOrder.item.status, "cancelled")
      assert.equal(cancelledOrder.item.refund?.status, "requested")

      const returnCheckout = await createCheckoutOrder(
        runtime.primary,
        config,
        {
          items: [{ productId, quantity: 1 }],
          shippingAddress: {
            fullName: "Request Customer",
            email: "requests@codexsun.local",
            phoneNumber: "+91 96666 22222",
            line1: "14 Market Road",
            line2: null,
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          billingAddress: {
            fullName: "Request Customer",
            email: "requests@codexsun.local",
            phoneNumber: "+91 96666 22222",
            line1: "14 Market Road",
            line2: null,
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          notes: null,
        },
        customerSession.accessToken
      )

      const paidReturnOrder = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: returnCheckout.order.id,
        providerOrderId: returnCheckout.payment.providerOrderId,
        providerPaymentId: "pay_return_request_001",
        signature: "mock_signature",
      })

      await applyStorefrontAdminOrderAction(runtime.primary, config, {
        orderId: paidReturnOrder.item.id,
        action: "mark_fulfilment_pending",
        note: "Packed and queued.",
      })
      await applyStorefrontAdminOrderAction(runtime.primary, config, {
        orderId: paidReturnOrder.item.id,
        action: "mark_shipped",
        trackingId: "DLV-RET-001",
        carrierName: "Delhivery",
        trackingUrl: "https://tracking.example.com/DLV-RET-001",
        note: "Dispatched for delivery.",
      })
      const deliveredReturnOrder = await applyStorefrontAdminOrderAction(runtime.primary, config, {
        orderId: paidReturnOrder.item.id,
        action: "mark_delivered",
        note: "Delivered to customer.",
      })

      const returnRequest = await createCustomerOrderRequest(
        runtime.primary,
        config,
        customerSession.accessToken,
        {
          orderId: deliveredReturnOrder.item.id,
          type: "return",
          orderItemId: deliveredReturnOrder.item.items[0]?.id ?? null,
          reason: "Received a defective unit and need a return review.",
        }
      )

      assert.equal(returnRequest.item.type, "return")
      assert.equal(returnRequest.item.itemName, deliveredReturnOrder.item.items[0]?.name ?? null)

      const queueReport = await getStorefrontOrderRequestQueueReport(runtime.primary)
      assert.equal(queueReport.summary.totalRequests, 2)
      assert.equal(queueReport.summary.cancellationCount, 1)
      assert.equal(queueReport.summary.returnCount, 1)

      const approvedReturn = await reviewStorefrontOrderRequest(runtime.primary, config, {
        requestId: returnRequest.item.id,
        status: "approved",
        adminNote: "Return approved after delivered-item review.",
      })

      assert.equal(approvedReturn.item.status, "approved")

      const returnOrderAfterApproval = await getStorefrontAdminOrder(
        runtime.primary,
        deliveredReturnOrder.item.id
      )

      assert.equal(returnOrderAfterApproval.item.status, "delivered")
      assert.equal(returnOrderAfterApproval.item.refund?.status, "requested")

      const customerRequests = await listCustomerOrderRequests(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(customerRequests.items.length, 2)
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

test("operational aging report groups fulfilment and refund work by age bands", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-operational-aging-"))

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

      const fulfilmentCheckout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Fulfilment Aging Customer",
          email: "fulfilment-aging@codexsun.local",
          phoneNumber: "+919999999987",
          line1: "13 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Fulfilment Aging Customer",
          email: "fulfilment-aging@codexsun.local",
          phoneNumber: "+919999999987",
          line1: "13 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const refundCheckout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Refund Aging Customer",
          email: "refund-aging@codexsun.local",
          phoneNumber: "+919999999986",
          line1: "14 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Refund Aging Customer",
          email: "refund-aging@codexsun.local",
          phoneNumber: "+919999999986",
          line1: "14 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const now = Date.now()
      const fulfilmentStartedAt = new Date(now - 80 * 60 * 60 * 1000).toISOString()
      const refundRequestedAt = new Date(now - 30 * 60 * 60 * 1000).toISOString()

      const fulfilmentOrder = {
        ...fulfilmentCheckout.order,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        paymentStatus: "paid" as const,
        status: "fulfilment_pending" as const,
        providerOrderId: "order_operational_aging_fulfilment",
        providerPaymentId: "pay_operational_aging_fulfilment",
        updatedAt: fulfilmentStartedAt,
        timeline: [
          ...fulfilmentCheckout.order.timeline,
          {
            id: "timeline:operational-aging-fulfilment",
            code: "fulfilment_ready",
            label: "Marked for fulfilment",
            summary: "Order is queued for fulfilment aging coverage.",
            createdAt: fulfilmentStartedAt,
          },
        ],
      }

      const refundOrder = {
        ...refundCheckout.order,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        paymentStatus: "paid" as const,
        status: "paid" as const,
        providerOrderId: "order_operational_aging_refund",
        providerPaymentId: "pay_operational_aging_refund",
        refund: {
          type: "full" as const,
          status: "processing" as const,
          requestedAmount: refundCheckout.order.totalAmount,
          currency: refundCheckout.order.currency,
          reason: "Refund aging coverage.",
          requestedBy: "admin" as const,
          requestedAt: refundRequestedAt,
          initiatedAt: refundRequestedAt,
          completedAt: null,
          failedAt: null,
          providerRefundId: null,
          statusSummary: "Refund request is active for aging coverage.",
          updatedAt: refundRequestedAt,
        },
        updatedAt: refundRequestedAt,
      }

      await replaceJsonStoreRecords(runtime.primary, ecommerceTableNames.orders, [
        {
          id: fulfilmentOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 1,
          payload: fulfilmentOrder,
          createdAt: fulfilmentOrder.createdAt,
          updatedAt: fulfilmentOrder.updatedAt,
        },
        {
          id: refundOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 2,
          payload: refundOrder,
          createdAt: refundOrder.createdAt,
          updatedAt: refundOrder.updatedAt,
        },
      ])

      const report = await getStorefrontOperationalAgingReport(runtime.primary)

      assert.equal(report.summary.fulfilmentAgingCount, 1)
      assert.equal(report.summary.fulfilmentOver72HoursCount, 1)
      assert.equal(report.summary.refundAgingCount, 1)
      assert.equal(report.summary.refundOver72HoursCount, 0)
      assert.equal(report.fulfilmentBuckets.find((item) => item.key === "over_72h")?.count, 1)
      assert.equal(report.refundBuckets.find((item) => item.key === "between_24h_48h")?.count, 1)
      assert.equal(report.fulfilmentItems[0]?.orderId, fulfilmentOrder.id)
      assert.equal(report.refundItems[0]?.orderId, refundOrder.id)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("overview KPI report summarizes conversion, AOV, order counts, and aging counts", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-overview-kpis-"))

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
          fullName: "Overview Paid Customer",
          email: "overview-paid@codexsun.local",
          phoneNumber: "+919999999985",
          line1: "15 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Overview Paid Customer",
          email: "overview-paid@codexsun.local",
          phoneNumber: "+919999999985",
          line1: "15 Finance Street",
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
          fullName: "Overview Failed Customer",
          email: "overview-failed@codexsun.local",
          phoneNumber: "+919999999984",
          line1: "16 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Overview Failed Customer",
          email: "overview-failed@codexsun.local",
          phoneNumber: "+919999999984",
          line1: "16 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const paidOrder = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: paidCheckout.order.id,
        providerOrderId: paidCheckout.payment.providerOrderId,
        providerPaymentId: "pay_overview_kpi_001",
        signature: "mock_signature",
      })

      const now = Date.now()
      const fulfilmentStartedAt = new Date(now - 80 * 60 * 60 * 1000).toISOString()
      const refundRequestedAt = new Date(now - 30 * 60 * 60 * 1000).toISOString()

      const fulfilmentOrder = {
        ...paidOrder.item,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        status: "fulfilment_pending" as const,
        updatedAt: fulfilmentStartedAt,
        timeline: [
          ...paidOrder.item.timeline,
          {
            id: "timeline:overview-kpi-fulfilment",
            code: "fulfilment_ready",
            label: "Marked for fulfilment",
            summary: "Order is queued for KPI fulfilment aging coverage.",
            createdAt: fulfilmentStartedAt,
          },
        ],
      }

      const failedOrder = {
        ...failedCheckout.order,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        paymentStatus: "failed" as const,
        status: "payment_pending" as const,
        providerOrderId: "order_overview_kpi_failed",
        providerPaymentId: "pay_overview_kpi_failed",
        updatedAt: refundRequestedAt,
      }

      await replaceJsonStoreRecords(runtime.primary, ecommerceTableNames.orders, [
        {
          id: fulfilmentOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 1,
          payload: fulfilmentOrder,
          createdAt: fulfilmentOrder.createdAt,
          updatedAt: fulfilmentOrder.updatedAt,
        },
        {
          id: failedOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 2,
          payload: failedOrder,
          createdAt: failedOrder.createdAt,
          updatedAt: failedOrder.updatedAt,
        },
      ])

      const report = await getStorefrontOverviewKpiReport(runtime.primary)

      assert.equal(report.summary.orderCount, 2)
      assert.equal(report.summary.paidOrderCount, 1)
      assert.equal(report.summary.failedOrderCount, 1)
      assert.equal(report.summary.pendingOrderCount, 0)
      assert.equal(report.summary.fulfilmentAgingCount, 1)
      assert.equal(report.summary.refundAgingCount, 0)
      assert.equal(report.summary.fulfilmentOver72HoursCount, 1)
      assert.equal(report.summary.refundOver72HoursCount, 0)
      assert.equal(report.summary.conversionRate, 50)
      assert.equal(report.summary.averageOrderValue, fulfilmentOrder.totalAmount)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("daily payment summary export returns grouped csv output for finance ops", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-payment-summary-"))

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

      const checkout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Daily Summary Customer",
          email: "daily-summary@codexsun.local",
          phoneNumber: "+919999999991",
          line1: "9 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Daily Summary Customer",
          email: "daily-summary@codexsun.local",
          phoneNumber: "+919999999991",
          line1: "9 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const paid = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.payment.providerOrderId,
        providerPaymentId: "pay_daily_summary_001",
        signature: "mock_signature",
      })

      const document = await getStorefrontPaymentDailySummaryDocument(runtime.primary, {
        days: 30,
      })

      assert.match(document.fileName, /storefront-payment-daily-summary-/)
      assert.match(document.csv, /day,currency,order_count/)
      assert.match(document.csv, /INR/)
      assert.match(document.csv, new RegExp(paid.item.totalAmount.toFixed(2).replace(".", "\\.")))
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("failed-payment report export returns csv rows for payment exceptions", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-failed-payment-report-"))

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

      const checkout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Failed Payment Customer",
          email: "failed-report@codexsun.local",
          phoneNumber: "+919999999990",
          line1: "10 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Failed Payment Customer",
          email: "failed-report@codexsun.local",
          phoneNumber: "+919999999990",
          line1: "10 Finance Street",
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
        paymentStatus: "failed" as const,
        status: "payment_pending" as const,
        providerOrderId: "order_failed_report_001",
        providerPaymentId: "pay_failed_report_001",
        timeline: [
          ...checkout.order.timeline,
          {
            id: "timeline:failed-report",
            code: "payment_failed",
            label: "Payment failed",
            summary: "Gateway declined the payment during testing.",
            createdAt: new Date().toISOString(),
          },
        ],
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

      const document = await getStorefrontFailedPaymentReportDocument(runtime.primary)

      assert.match(document.fileName, /storefront-failed-payments-/)
      assert.match(document.csv, /order_number,order_status,payment_status/)
      assert.match(document.csv, /ECM-/)
      assert.match(document.csv, /failed-report@codexsun\.local/)
      assert.match(document.csv, /pay_failed_report_001/)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("refund report export returns csv rows for refund queue operations", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-refund-report-"))

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

      const checkout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Refund Report Customer",
          email: "refund-report@codexsun.local",
          phoneNumber: "+919999999989",
          line1: "11 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Refund Report Customer",
          email: "refund-report@codexsun.local",
          phoneNumber: "+919999999989",
          line1: "11 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.payment.providerOrderId,
        providerPaymentId: "pay_refund_report_001",
        signature: "mock_signature",
      })

      const liveRefundOrder = {
        ...checkout.order,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        paymentStatus: "paid" as const,
        status: "paid" as const,
        providerOrderId: "order_refund_report_001",
        providerPaymentId: "pay_refund_report_001",
        timeline: [
          ...checkout.order.timeline,
          {
            id: "timeline:refund-report-paid",
            code: "payment_captured",
            label: "Payment captured",
            summary: "Payment captured for refund report coverage.",
            createdAt: new Date().toISOString(),
          },
        ],
      }

      await replaceJsonStoreRecords(runtime.primary, ecommerceTableNames.orders, [
        {
          id: liveRefundOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 1,
          payload: liveRefundOrder,
          createdAt: liveRefundOrder.createdAt,
          updatedAt: liveRefundOrder.updatedAt,
        },
      ])

      await requestStorefrontRefund(runtime.primary, {
        orderId: checkout.order.id,
        reason: "Customer requested refund report coverage.",
      })

      const document = await getStorefrontRefundReportDocument(runtime.primary)

      assert.match(document.fileName, /storefront-refunds-/)
      assert.match(document.csv, /order_number,order_status,payment_status,refund_status/)
      assert.match(document.csv, /refund-report@codexsun\.local/)
      assert.match(document.csv, /requested/)
      assert.match(document.csv, /pay_refund_report_001/)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("settlement-gap report export returns csv rows for paid live orders awaiting settlement visibility", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-settlement-gap-report-"))

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

      const checkout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Settlement Gap Customer",
          email: "settlement-gap@codexsun.local",
          phoneNumber: "+919999999988",
          line1: "12 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Settlement Gap Customer",
          email: "settlement-gap@codexsun.local",
          phoneNumber: "+919999999988",
          line1: "12 Finance Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      const paidOrder = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.payment.providerOrderId,
        providerPaymentId: "pay_settlement_gap_001",
        signature: "mock_signature",
      })

      const liveSettlementOrder = {
        ...paidOrder.item,
        paymentMode: "live" as const,
        paymentProvider: "razorpay" as const,
        providerOrderId: "order_settlement_gap_001",
        providerPaymentId: "pay_settlement_gap_001",
      }

      await replaceJsonStoreRecords(runtime.primary, ecommerceTableNames.orders, [
        {
          id: liveSettlementOrder.id,
          moduleKey: "storefront-order",
          sortOrder: 1,
          payload: liveSettlementOrder,
          createdAt: liveSettlementOrder.createdAt,
          updatedAt: liveSettlementOrder.updatedAt,
        },
      ])

      const document = await getStorefrontSettlementGapReportDocument(runtime.primary)

      assert.match(document.fileName, /storefront-settlement-gaps-/)
      assert.match(document.csv, /order_number,order_status,payment_status/)
      assert.match(document.csv, /settlement-gap@codexsun\.local/)
      assert.match(document.csv, /pay_settlement_gap_001/)
      assert.match(
        document.csv,
        new RegExp(paidOrder.item.totalAmount.toFixed(2).replace(".", "\\."))
      )
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

      const queuedRefund = await updateStorefrontRefundStatus(runtime.primary, {
        orderId: livePaidOrder.id,
        status: "queued",
      })

      assert.equal(queuedRefund.item.refund?.status, "queued")

      const processingRefund = await updateStorefrontRefundStatus(runtime.primary, {
        orderId: livePaidOrder.id,
        status: "processing",
      })

      assert.equal(processingRefund.item.refund?.status, "processing")

      const refundReport = await getStorefrontPaymentOperationsReport(runtime.primary)
      const refundQueueItem = refundReport.refundQueue.find((item) => item.orderId === livePaidOrder.id)

      assert.equal(refundReport.summary.refundQueueCount > 0, true)
      assert.equal(refundQueueItem?.refundStatus, "processing")

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

test("customer communication history only returns messages for the authenticated customer and selected order", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-customer-communications-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await registerVerifiedCustomer(runtime, config, {
        displayName: "Portal Comms",
        email: "portal-comms@codexsun.local",
        phoneNumber: "+919999999994",
        password: "Password@123",
        companyName: "",
        gstin: "",
        addressLine1: "10 Mail Street",
        addressLine2: "",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600001",
      })

      await registerVerifiedCustomer(runtime, config, {
        displayName: "Other Customer",
        email: "other-comms@codexsun.local",
        phoneNumber: "+919999999995",
        password: "Password@123",
        companyName: "",
        gstin: "",
        addressLine1: "11 Mail Street",
        addressLine2: "",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600001",
      })

      const authService = createAuthService(runtime.primary, config)
      const customerSession = await authService.login({
        email: "portal-comms@codexsun.local",
        password: "Password@123",
      })
      const otherCustomerSession = await authService.login({
        email: "other-comms@codexsun.local",
        password: "Password@123",
      })

      const catalog = await getStorefrontCatalog(runtime.primary, {})
      const productId = catalog.items[0]?.id
      assert.ok(productId)

      const firstCheckout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Portal Comms",
          email: "portal-comms@codexsun.local",
          phoneNumber: "+919999999994",
          line1: "10 Mail Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Portal Comms",
          email: "portal-comms@codexsun.local",
          phoneNumber: "+919999999994",
          line1: "10 Mail Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      await verifyCheckoutPayment(runtime.primary, config, {
        orderId: firstCheckout.order.id,
        providerOrderId: firstCheckout.payment.providerOrderId,
        providerPaymentId: "pay_customer_comms_001",
        signature: "mock_signature",
      })

      const secondCheckout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId, quantity: 1 }],
        shippingAddress: {
          fullName: "Other Customer",
          email: "other-comms@codexsun.local",
          phoneNumber: "+919999999995",
          line1: "11 Mail Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Other Customer",
          email: "other-comms@codexsun.local",
          phoneNumber: "+919999999995",
          line1: "11 Mail Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: null,
      })

      await verifyCheckoutPayment(runtime.primary, config, {
        orderId: secondCheckout.order.id,
        providerOrderId: secondCheckout.payment.providerOrderId,
        providerPaymentId: "pay_customer_comms_002",
        signature: "mock_signature",
      })

      const customerLog = await listCustomerCommunicationLog(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(customerLog.items.some((item) => item.referenceId === firstCheckout.order.id), true)
      assert.equal(customerLog.items.some((item) => item.referenceId === secondCheckout.order.id), false)

      const filteredLog = await listCustomerCommunicationLog(
        runtime.primary,
        config,
        customerSession.accessToken,
        { orderId: firstCheckout.order.id }
      )

      assert.equal(filteredLog.items.every((item) => item.referenceId === firstCheckout.order.id), true)

      await assert.rejects(
        () =>
          listCustomerCommunicationLog(runtime.primary, config, customerSession.accessToken, {
            orderId: secondCheckout.order.id,
          }),
        /Communication history can only be viewed for your own orders/
      )

      const otherLog = await listCustomerCommunicationLog(
        runtime.primary,
        config,
        otherCustomerSession.accessToken
      )

      assert.equal(otherLog.items.some((item) => item.referenceId === secondCheckout.order.id), true)
      assert.equal(otherLog.items.some((item) => item.referenceId === firstCheckout.order.id), false)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("customer lifecycle actions block portal access and anonymize retained customer identity", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-customer-lifecycle-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false
    config.notifications.email.enabled = false
    config.auth.otpDebug = true

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await registerVerifiedCustomer(runtime, config, {
        displayName: "Lifecycle Customer",
        email: "lifecycle@codexsun.local",
        phoneNumber: "+919999999996",
        password: "Password@123",
        companyName: "Lifecycle Retail",
        gstin: "",
        addressLine1: "42 State Road",
        addressLine2: "",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600001",
      })

      const authService = createAuthService(runtime.primary, config)
      const customerSession = await authService.login({
        email: "lifecycle@codexsun.local",
        password: "Password@123",
      })

      const customerProfile = await getAuthenticatedCustomer(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(customerProfile.lifecycleState, "active")

      const report = await getStorefrontCustomerOperationsReport(runtime.primary)
      const customerAccount = report.items.find(
        (item) => item.email === "lifecycle@codexsun.local"
      )

      assert.ok(customerAccount)

      const blocked = await applyStorefrontCustomerLifecycleAction(runtime.primary, {
        customerAccountId: customerAccount!.id,
        action: "block",
        note: "Fraud review hold",
      })

      assert.equal(blocked.item.lifecycleState, "blocked")
      assert.equal(blocked.item.isActive, false)

      await assert.rejects(
        () =>
          authService.login({
            email: "lifecycle@codexsun.local",
            password: "Password@123",
          }),
        /disabled|temporarily locked|Invalid credentials/
      )

      const anonymized = await applyStorefrontCustomerLifecycleAction(runtime.primary, {
        customerAccountId: customerAccount!.id,
        action: "anonymize",
        note: "Privacy request",
      })

      assert.equal(anonymized.item.lifecycleState, "anonymized")
      assert.match(anonymized.item.email, /redacted\.local$/)
      assert.match(anonymized.item.displayName, /Anonymized Customer/)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("customer registration stores verified email state and suspicious login events can be reviewed", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-customer-security-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false
    config.notifications.email.enabled = false
    config.auth.otpDebug = true

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await registerVerifiedCustomer(runtime, config, {
        displayName: "Security Customer",
        email: "security@codexsun.local",
        phoneNumber: "+919999999997",
        password: "Password@123",
        companyName: "",
        gstin: "",
        addressLine1: "17 Secure Street",
        addressLine2: "",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600001",
      })

      const authService = createAuthService(runtime.primary, config)
      await assert.rejects(
        () =>
          authService.login(
            {
              email: "security@codexsun.local",
              password: "WrongPassword@123",
            },
            {
              ipAddress: "127.0.0.9",
              userAgent: "node:test suspicious login",
            }
          ),
        /Invalid credentials/
      )

      const report = await getStorefrontCustomerOperationsReport(runtime.primary)
      const customer = report.items.find((item) => item.email === "security@codexsun.local")

      assert.ok(customer)
      assert.ok(customer?.emailVerifiedAt)
      assert.equal(customer?.suspiciousLoginOpenCount, 1)

      const detail = await getStorefrontCustomerAccount(runtime.primary, customer!.id)

      assert.equal(detail.suspiciousLoginEvents.length, 1)
      assert.equal(detail.suspiciousLoginEvents[0]?.action, "login_failed")

      const reviewed = await markStorefrontCustomerSecurityReview(runtime.primary, {
        customerAccountId: customer!.id,
        note: "Customer mistyped the password once and confirmed identity.",
      })

      assert.ok(reviewed.item.suspiciousLoginReviewedAt)
      assert.equal(reviewed.item.suspiciousLoginOpenCount, 0)
      assert.equal(
        reviewed.item.suspiciousLoginReviewNote,
        "Customer mistyped the password once and confirmed identity."
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
