import {
  getStorefrontFooter,
  getStorefrontFloatingContact,
  getStorefrontPickupLocation,
  getStorefrontCouponBanner,
  getStorefrontGiftCorner,
  getStorefrontBrandShowcase,
  getStorefrontCampaign,
  getStorefrontTrendingSection,
  getStorefrontHomeSlider,
  getStorefrontDesignerSettings,
  getStorefrontSettingsVersionHistory,
  getStorefrontSettingsWorkflowStatus,
  publishStorefrontSettingsDraft,
  rollbackStorefrontSettings,
  saveStorefrontFooter,
  saveStorefrontFloatingContact,
  saveStorefrontPickupLocation,
  saveStorefrontCouponBanner,
  saveStorefrontGiftCorner,
  saveStorefrontBrandShowcase,
  saveStorefrontCampaign,
  saveStorefrontTrendingSection,
  saveStorefrontHomeSlider,
  saveStorefrontSettings,
} from "../../../ecommerce/src/services/storefront-settings-service.js"
import {
  getStorefrontMerchandisingAutomationReport,
  getStorefrontRecommendationReport,
} from "../../../ecommerce/src/services/catalog-service.js"
import {
  assertStorefrontMailboxTemplates,
  listStorefrontCommunicationLog,
  resendStorefrontCommunication,
} from "../../../ecommerce/src/services/storefront-communication-service.js"
import {
  applyStorefrontAdminOrderAction,
  getStorefrontAdminOrder,
  getStorefrontFailedPaymentReportDocument,
  getStorefrontAdminOrderOperationsReport,
  getStorefrontOverviewKpiReport,
  getStorefrontAccountingCompatibilityReport,
  getStorefrontPaymentDailySummaryDocument,
  getStorefrontOperationalAgingReport,
  getStorefrontOrderForConnector,
  getStorefrontRefundReportDocument,
  getStorefrontPaymentOperationsReport,
  getStorefrontSettlementGapReportDocument,
  requestStorefrontRefund,
  reconcileRazorpayPayments,
  updateStorefrontRefundStatus,
} from "../../../ecommerce/src/services/order-service.js"
import { pushStorefrontOrderToFrappeSalesOrder } from "../../../frappe/src/services/sales-order-service.js"
import {
  getStorefrontSupportQueueReport,
  updateStorefrontSupportCase,
} from "../../../ecommerce/src/services/storefront-support-service.js"
import {
  applyStorefrontCustomerLifecycleAction,
  getStorefrontCustomerAccount,
  getStorefrontCustomerSegmentationReport,
  getStorefrontCustomerOperationsReport,
  getStorefrontLifecycleMarketingReport,
  markStorefrontCustomerSecurityReview,
} from "../../../ecommerce/src/services/customer-service.js"
import {
  getStorefrontOrderRequestQueueReport,
  reviewStorefrontOrderRequest,
} from "../../../ecommerce/src/services/storefront-order-request-service.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { jsonResponse, textResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createEcommerceInternalRoutes(): HttpRouteDefinition[] {
  const storefrontDesignerViewPermissionKeys = new Set([
    "ecommerce:storefront:view",
    "ecommerce:storefront:design",
    "ecommerce:storefront:manage",
  ])
  const storefrontDesignerEditPermissionKeys = new Set([
    "ecommerce:storefront:design",
    "ecommerce:storefront:manage",
  ])
  const storefrontDesignerApprovePermissionKeys = new Set([
    "ecommerce:storefront:approve",
    "ecommerce:storefront:manage",
  ])

  const requireStorefrontView = async (context: Parameters<typeof requireAuthenticatedUser>[0]) => {
    const session = await requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["ecommerce:workspace:view"],
    })

    if (
      !session.user.isSuperAdmin &&
      !session.user.permissions.some((permission) =>
        storefrontDesignerViewPermissionKeys.has(permission.key)
      )
    ) {
      throw new ApplicationError("You do not have permission to access this route.", {
        missingPermissionKeys: ["ecommerce:storefront:view"],
      }, 403)
    }

    return session
  }

  const requireStorefrontManage = async (context: Parameters<typeof requireAuthenticatedUser>[0]) => {
    const session = await requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["ecommerce:workspace:view"],
    })

    if (
      !session.user.isSuperAdmin &&
      !session.user.permissions.some((permission) =>
        storefrontDesignerEditPermissionKeys.has(permission.key)
      )
    ) {
      throw new ApplicationError("You do not have permission to access this route.", {
        missingPermissionKeys: ["ecommerce:storefront:design"],
      }, 403)
    }

    return session
  }
  const requireStorefrontApprove = async (context: Parameters<typeof requireAuthenticatedUser>[0]) => {
    const session = await requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["ecommerce:workspace:view"],
    })

    if (
      !session.user.isSuperAdmin &&
      !session.user.permissions.some((permission) =>
        storefrontDesignerApprovePermissionKeys.has(permission.key)
      )
    ) {
      throw new ApplicationError("You do not have permission to access this route.", {
        missingPermissionKeys: ["ecommerce:storefront:approve"],
      }, 403)
    }

    return session
  }
  const requireOrdersManage = (context: Parameters<typeof requireAuthenticatedUser>[0]) =>
    requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["ecommerce:workspace:view", "ecommerce:orders:manage"],
    })
  const requireSupportManage = (context: Parameters<typeof requireAuthenticatedUser>[0]) =>
    requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["ecommerce:workspace:view", "ecommerce:support:manage"],
    })
  const requireCustomersManage = (context: Parameters<typeof requireAuthenticatedUser>[0]) =>
    requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["ecommerce:workspace:view", "ecommerce:customers:manage"],
    })
  const requirePaymentsManage = (context: Parameters<typeof requireAuthenticatedUser>[0]) =>
    requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["ecommerce:workspace:view", "ecommerce:payments:manage"],
    })
  const requireCommunicationsView = (context: Parameters<typeof requireAuthenticatedUser>[0]) =>
    requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["ecommerce:workspace:view", "ecommerce:communications:view"],
    })
  const requireAnalyticsView = (context: Parameters<typeof requireAuthenticatedUser>[0]) =>
    requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["ecommerce:workspace:view", "ecommerce:analytics:view"],
    })
  const pushPaidOrdersToFrappe = async (
    database: Parameters<typeof getStorefrontOrderForConnector>[0],
    orderIds: string[],
    source: "payment_reconcile"
  ) => {
    for (const orderId of [...new Set(orderIds.filter(Boolean))]) {
      const order = await getStorefrontOrderForConnector(database, orderId)

      if (!order || order.paymentStatus !== "paid") {
        continue
      }

      try {
        await pushStorefrontOrderToFrappeSalesOrder(database, order, { source })
      } catch (error) {
        console.error("Unable to push reconciled storefront order into ERPNext Sales Order.", error)
      }
    }
  }

  return [
    defineInternalRoute("/ecommerce/storefront-settings", {
      summary: "Read ecommerce-owned storefront settings for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(await getStorefrontDesignerSettings(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-settings/workflow", {
      summary: "Read storefront draft, live, preview, and rollback workflow state for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(
          await getStorefrontSettingsWorkflowStatus(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-settings/history", {
      summary: "Read storefront version history for the full settings document and key content blocks.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(
          await getStorefrontSettingsVersionHistory(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-settings", {
      method: "PATCH",
      summary: "Save ecommerce-owned storefront settings into the draft editor workspace.",
      handler: async (context) => {
        await requireStorefrontManage(context)

        return jsonResponse(
          await saveStorefrontSettings(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/home-slider", {
      summary: "Read ecommerce-owned home-slider design settings for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(await getStorefrontHomeSlider(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/home-slider", {
      method: "PATCH",
      summary: "Update ecommerce-owned home-slider design settings used by the public hero.",
      handler: async (context) => {
        await requireStorefrontManage(context)

        return jsonResponse(
          await saveStorefrontHomeSlider(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-footer", {
      summary: "Read ecommerce-owned storefront footer settings for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(await getStorefrontFooter(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-footer", {
      method: "PATCH",
      summary: "Update ecommerce-owned storefront footer settings used by public surfaces.",
      handler: async (context) => {
        await requireStorefrontManage(context)

        return jsonResponse(
          await saveStorefrontFooter(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-floating-contact", {
      summary: "Read ecommerce-owned floating-contact settings for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(await getStorefrontFloatingContact(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-floating-contact", {
      method: "PATCH",
      summary: "Update ecommerce-owned floating-contact settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireStorefrontManage(context)

        return jsonResponse(
          await saveStorefrontFloatingContact(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-pickup-location", {
      summary: "Read ecommerce-owned pickup-location settings for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(await getStorefrontPickupLocation(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-pickup-location", {
      method: "PATCH",
      summary: "Update ecommerce-owned pickup-location settings used by public storefront checkout surfaces.",
      handler: async (context) => {
        await requireStorefrontManage(context)

        return jsonResponse(
          await saveStorefrontPickupLocation(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-coupon-banner", {
      summary: "Read ecommerce-owned coupon-banner settings for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(await getStorefrontCouponBanner(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-coupon-banner", {
      method: "PATCH",
      summary: "Update ecommerce-owned coupon-banner settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireStorefrontManage(context)

        return jsonResponse(
          await saveStorefrontCouponBanner(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-gift-corner", {
      summary: "Read ecommerce-owned gift-corner settings for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(await getStorefrontGiftCorner(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-gift-corner", {
      method: "PATCH",
      summary: "Update ecommerce-owned gift-corner settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireStorefrontManage(context)

        return jsonResponse(
          await saveStorefrontGiftCorner(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-trending-section", {
      summary: "Read ecommerce-owned trending-section settings for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(await getStorefrontTrendingSection(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-trending-section", {
      method: "PATCH",
      summary: "Update ecommerce-owned trending-section settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireStorefrontManage(context)

        return jsonResponse(
          await saveStorefrontTrendingSection(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-brand-showcase", {
      summary: "Read ecommerce-owned brand-showcase settings for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(await getStorefrontBrandShowcase(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-brand-showcase", {
      method: "PATCH",
      summary: "Update ecommerce-owned brand-showcase settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireStorefrontManage(context)

        return jsonResponse(
          await saveStorefrontBrandShowcase(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-campaign", {
      summary: "Read ecommerce-owned campaign and trust settings for the admin editor.",
      handler: async (context) => {
        await requireStorefrontView(context)

        return jsonResponse(await getStorefrontCampaign(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-campaign", {
      method: "PATCH",
      summary: "Update ecommerce-owned campaign and trust settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireStorefrontManage(context)

        return jsonResponse(
          await saveStorefrontCampaign(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/communications/health", {
      summary: "Validate required storefront mailbox templates for ecommerce customer communications.",
      handler: async (context) => {
        await requireCommunicationsView(context)

        return jsonResponse(
          await assertStorefrontMailboxTemplates(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/communications", {
      summary: "List storefront customer communication activity from mailbox records.",
      handler: async (context) => {
        await requireCommunicationsView(context)

        return jsonResponse(
          await listStorefrontCommunicationLog(context.databases.primary, {
            orderId:
              typeof context.request.url.searchParams.get("orderId") === "string"
                ? context.request.url.searchParams.get("orderId")
                : null,
            customerAccountId:
              typeof context.request.url.searchParams.get("customerAccountId") === "string"
                ? context.request.url.searchParams.get("customerAccountId")
                : null,
          })
        )
      },
    }),
    defineInternalRoute("/ecommerce/customers/report", {
      summary: "Read the ecommerce customer lifecycle queue and portal-account summary.",
      handler: async (context) => {
        await requireCustomersManage(context)

        return jsonResponse(
          await getStorefrontCustomerOperationsReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-settings/publish", {
      method: "POST",
      summary: "Publish the current storefront draft into the live public storefront configuration.",
      handler: async (context) => {
        await requireStorefrontApprove(context)

        return jsonResponse(
          await publishStorefrontSettingsDraft(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-settings/rollback", {
      method: "POST",
      summary: "Rollback the live storefront configuration to a previous immutable revision snapshot.",
      handler: async (context) => {
        await requireStorefrontApprove(context)

        return jsonResponse(
          await rollbackStorefrontSettings(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/overview-report", {
      summary: "Read ecommerce overview KPIs for commerce operations dashboard cards.",
      handler: async (context) => {
        await requireAnalyticsView(context)

        return jsonResponse(
          await getStorefrontOverviewKpiReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/advanced-commerce/recommendations", {
      summary: "Read recommendation and search-ranking preview output for advanced ecommerce merchandising.",
      handler: async (context) => {
        await requireAnalyticsView(context)

        return jsonResponse(
          await getStorefrontRecommendationReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/advanced-commerce/segments", {
      summary: "Read customer commercial segmentation and segment-pricing posture for advanced ecommerce operations.",
      handler: async (context) => {
        await requireAnalyticsView(context)

        return jsonResponse(
          await getStorefrontCustomerSegmentationReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/advanced-commerce/lifecycle-marketing", {
      summary: "Read lifecycle marketing readiness, subscription posture, and next-campaign recommendations.",
      handler: async (context) => {
        await requireAnalyticsView(context)

        return jsonResponse(
          await getStorefrontLifecycleMarketingReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/advanced-commerce/merchandising", {
      summary: "Read merchandising automation candidates and experimentation-ready storefront surfaces.",
      handler: async (context) => {
        await requireAnalyticsView(context)

        return jsonResponse(
          await getStorefrontMerchandisingAutomationReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/customer", {
      summary: "Read one ecommerce customer account with lifecycle and activity summary.",
      handler: async (context) => {
        await requireCustomersManage(context)

        return jsonResponse(
          await getStorefrontCustomerAccount(
            context.databases.primary,
            context.request.url.searchParams.get("id") ?? ""
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/customer/lifecycle", {
      method: "POST",
      summary: "Apply a lifecycle action such as activate, block, delete, or anonymize to a storefront customer account.",
      handler: async (context) => {
        await requireCustomersManage(context)

        return jsonResponse(
          await applyStorefrontCustomerLifecycleAction(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/customer/security-review", {
      method: "POST",
      summary: "Mark storefront customer suspicious-login activity as reviewed.",
      handler: async (context) => {
        await requireCustomersManage(context)

        return jsonResponse(
          await markStorefrontCustomerSecurityReview(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/orders/report", {
      summary: "Read the ecommerce admin order queue with lifecycle and payment context.",
      handler: async (context) => {
        await requireOrdersManage(context)

        return jsonResponse(
          await getStorefrontAdminOrderOperationsReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/order", {
      summary: "Read one ecommerce order with full timeline and shipment details for admin operations.",
      handler: async (context) => {
        await requireOrdersManage(context)

        return jsonResponse(
          await getStorefrontAdminOrder(
            context.databases.primary,
            context.request.url.searchParams.get("id") ?? ""
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/order/action", {
      method: "POST",
      summary: "Apply an admin order operation such as cancel, fulfilment progression, shipment update, or resend confirmation.",
      handler: async (context) => {
        await requireOrdersManage(context)

        return jsonResponse(
          await applyStorefrontAdminOrderAction(
            context.databases.primary,
            context.config,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/communications/resend", {
      method: "POST",
      summary: "Resend supported storefront customer communications such as order confirmation or payment failed emails.",
      handler: async (context) => {
        await requireCommunicationsView(context)

        return jsonResponse(
          await resendStorefrontCommunication(
            context.databases.primary,
            context.config,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/payments/reconcile", {
      method: "POST",
      summary: "Run Razorpay payment reconciliation against ecommerce orders.",
      handler: async (context) => {
        await requirePaymentsManage(context)

        const response = await reconcileRazorpayPayments(
          context.databases.primary,
          context.config,
          context.request.jsonBody
        )
        const paidOrderIds = response.items
          .filter((item) => item.action === "paid")
          .map((item) => item.orderId)

        await pushPaidOrdersToFrappe(
          context.databases.primary,
          paidOrderIds,
          "payment_reconcile"
        )

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/ecommerce/payments/refund-request", {
      method: "POST",
      summary: "Record a refund initiation request for an ecommerce order.",
      handler: async (context) => {
        await requirePaymentsManage(context)

        return jsonResponse(
          await requestStorefrontRefund(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/payments/refund-status", {
      method: "POST",
      summary: "Update the admin-managed status of an ecommerce refund request.",
      handler: async (context) => {
        await requirePaymentsManage(context)

        return jsonResponse(
          await updateStorefrontRefundStatus(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/payments/report", {
      summary: "Read settlement visibility and failed-payment exception reporting for ecommerce payments.",
      handler: async (context) => {
        await requirePaymentsManage(context)

        return jsonResponse(
          await getStorefrontPaymentOperationsReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/payments/aging-report", {
      summary: "Read fulfilment-aging and refund-aging operational reporting for ecommerce finance operations.",
      handler: async (context) => {
        await requirePaymentsManage(context)

        return jsonResponse(
          await getStorefrontOperationalAgingReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/payments/accounting-compatibility-report", {
      summary: "Read invoice and GST compatibility checks between ecommerce orders and current billing workflows.",
      handler: async (context) => {
        await requirePaymentsManage(context)

        return jsonResponse(
          await getStorefrontAccountingCompatibilityReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/payments/daily-summary-export", {
      summary: "Download the ecommerce daily payment summary export as CSV.",
      handler: async (context) => {
        await requirePaymentsManage(context)

        const daysValue = Number(context.request.url.searchParams.get("days") ?? "30")
        const document = await getStorefrontPaymentDailySummaryDocument(context.databases.primary, {
          days: Number.isFinite(daysValue) ? daysValue : 30,
        })

        return textResponse(
          document.csv,
          "text/csv; charset=utf-8",
          200,
          document.fileName
        )
      },
    }),
    defineInternalRoute("/ecommerce/payments/failed-report-export", {
      summary: "Download the ecommerce failed-payment report as CSV.",
      handler: async (context) => {
        await requirePaymentsManage(context)

        const document = await getStorefrontFailedPaymentReportDocument(
          context.databases.primary
        )

        return textResponse(
          document.csv,
          "text/csv; charset=utf-8",
          200,
          document.fileName
        )
      },
    }),
    defineInternalRoute("/ecommerce/payments/refund-report-export", {
      summary: "Download the ecommerce refund report as CSV.",
      handler: async (context) => {
        await requirePaymentsManage(context)

        const document = await getStorefrontRefundReportDocument(
          context.databases.primary
        )

        return textResponse(
          document.csv,
          "text/csv; charset=utf-8",
          200,
          document.fileName
        )
      },
    }),
    defineInternalRoute("/ecommerce/payments/settlement-gap-report-export", {
      summary: "Download the ecommerce settlement-gap report as CSV.",
      handler: async (context) => {
        await requirePaymentsManage(context)

        const document = await getStorefrontSettlementGapReportDocument(
          context.databases.primary
        )

        return textResponse(
          document.csv,
          "text/csv; charset=utf-8",
          200,
          document.fileName
        )
      },
    }),
    defineInternalRoute("/ecommerce/support/report", {
      summary: "Read the ecommerce support-case queue linked to customers and orders.",
      handler: async (context) => {
        await requireSupportManage(context)

        return jsonResponse(
          await getStorefrontSupportQueueReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/support/case", {
      method: "POST",
      summary: "Update one ecommerce support case status, priority, or admin note.",
      handler: async (context) => {
        await requireSupportManage(context)

        return jsonResponse(
          await updateStorefrontSupportCase(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/order-requests/report", {
      summary: "Read the ecommerce customer return and cancellation request queue.",
      handler: async (context) => {
        await requireOrdersManage(context)

        return jsonResponse(
          await getStorefrontOrderRequestQueueReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/order-request/review", {
      method: "POST",
      summary: "Review one ecommerce customer return or cancellation request.",
      handler: async (context) => {
        await requireOrdersManage(context)

        return jsonResponse(
          await reviewStorefrontOrderRequest(
            context.databases.primary,
            context.config,
            context.request.jsonBody
          )
        )
      },
    }),
  ]
}
