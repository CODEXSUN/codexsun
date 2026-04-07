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
  getStorefrontSettings,
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
  assertStorefrontMailboxTemplates,
  listStorefrontCommunicationLog,
  resendStorefrontCommunication,
} from "../../../ecommerce/src/services/storefront-communication-service.js"
import {
  applyStorefrontAdminOrderAction,
  getStorefrontAdminOrder,
  getStorefrontAdminOrderOperationsReport,
  getStorefrontPaymentOperationsReport,
  requestStorefrontRefund,
  reconcileRazorpayPayments,
  updateStorefrontRefundStatus,
} from "../../../ecommerce/src/services/order-service.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createEcommerceInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/ecommerce/storefront-settings", {
      summary: "Read ecommerce-owned storefront settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontSettings(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-settings", {
      method: "PATCH",
      summary: "Update ecommerce-owned storefront settings used by public surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontHomeSlider(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/home-slider", {
      method: "PATCH",
      summary: "Update ecommerce-owned home-slider design settings used by the public hero.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontFooter(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-footer", {
      method: "PATCH",
      summary: "Update ecommerce-owned storefront footer settings used by public surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontFloatingContact(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-floating-contact", {
      method: "PATCH",
      summary: "Update ecommerce-owned floating-contact settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontPickupLocation(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-pickup-location", {
      method: "PATCH",
      summary: "Update ecommerce-owned pickup-location settings used by public storefront checkout surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontCouponBanner(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-coupon-banner", {
      method: "PATCH",
      summary: "Update ecommerce-owned coupon-banner settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontGiftCorner(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-gift-corner", {
      method: "PATCH",
      summary: "Update ecommerce-owned gift-corner settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontTrendingSection(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-trending-section", {
      method: "PATCH",
      summary: "Update ecommerce-owned trending-section settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontBrandShowcase(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-brand-showcase", {
      method: "PATCH",
      summary: "Update ecommerce-owned brand-showcase settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontCampaign(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-campaign", {
      method: "PATCH",
      summary: "Update ecommerce-owned campaign and trust settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await assertStorefrontMailboxTemplates(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/communications", {
      summary: "List storefront customer communication activity from mailbox records.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

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
    defineInternalRoute("/ecommerce/orders/report", {
      summary: "Read the ecommerce admin order queue with lifecycle and payment context.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await getStorefrontAdminOrderOperationsReport(context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/ecommerce/order", {
      summary: "Read one ecommerce order with full timeline and shipment details for admin operations.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await reconcileRazorpayPayments(
            context.databases.primary,
            context.config,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/payments/refund-request", {
      method: "POST",
      summary: "Record a refund initiation request for an ecommerce order.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

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
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await getStorefrontPaymentOperationsReport(context.databases.primary)
        )
      },
    }),
  ]
}
