import {
  getAuthenticatedCustomer,
  getAuthenticatedCustomerProfileLookups,
  getAuthenticatedCustomerPortal,
  getStorefrontCustomerProfileLookups,
  registerCustomer,
  toggleCustomerWishlistItem,
  updateCustomerProfile,
  updateCustomerPortalPreferences,
} from "../../../ecommerce/src/services/customer-service.js"
import {
  createCustomerSupportCase,
  listCustomerSupportCases,
} from "../../../ecommerce/src/services/storefront-support-service.js"
import {
  createCustomerOrderRequest,
  listCustomerOrderRequests,
} from "../../../ecommerce/src/services/storefront-order-request-service.js"
import {
  createCheckoutOrder,
  getCustomerOrder,
  getCustomerOrderReceiptDocument,
  handleRazorpayWebhook,
  listCustomerOrders,
  verifyCheckoutPayment,
} from "../../../ecommerce/src/services/order-service.js"
import { getRazorpayPaymentConfig } from "../../../ecommerce/src/services/razorpay-service.js"
import { defineExternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { htmlResponse, jsonResponse } from "../shared/http-responses.js"
import { readBearerToken, readHeader } from "../shared/request.js"

export function createEcommerceExternalRoutes(): HttpRouteDefinition[] {
  return [
    defineExternalRoute("/storefront/customers/register", {
      auth: "none",
      method: "POST",
      summary: "Register a storefront customer account and create the linked core contact.",
      handler: async (context) =>
        jsonResponse(
          await registerCustomer(
            context.databases.primary,
            context.config,
            context.request.jsonBody
          ),
          201
        ),
    }),
    defineExternalRoute("/storefront/customers/me", {
      auth: "external",
      summary: "Resolve the authenticated storefront customer profile.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await getAuthenticatedCustomer(
            context.databases.primary,
            context.config,
            token
          )
        )
      },
    }),
    defineExternalRoute("/storefront/customers/me/lookups", {
      auth: "external",
      summary: "Resolve customer-safe lookup options used by the customer profile editor.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await getAuthenticatedCustomerProfileLookups(
            context.databases.primary,
            context.config,
            token
          )
        )
      },
    }),
    defineExternalRoute("/storefront/checkout/lookups", {
      auth: "none",
      summary: "Resolve public checkout lookup options for guest and authenticated storefront checkout.",
      handler: async (context) =>
        jsonResponse(await getStorefrontCustomerProfileLookups(context.databases.primary)),
    }),
    defineExternalRoute("/storefront/customers/me", {
      auth: "external",
      method: "PATCH",
      summary: "Update the authenticated storefront customer profile.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await updateCustomerProfile(
            context.databases.primary,
            context.config,
            token,
            context.request.jsonBody
          )
        )
      },
    }),
    defineExternalRoute("/storefront/customers/me/portal", {
      auth: "external",
      summary: "Resolve the authenticated storefront customer's portal state.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await getAuthenticatedCustomerPortal(
            context.databases.primary,
            context.config,
            token
          )
        )
      },
    }),
    defineExternalRoute("/storefront/customers/me/preferences", {
      auth: "external",
      method: "PATCH",
      summary: "Update authenticated storefront customer portal preferences.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await updateCustomerPortalPreferences(
            context.databases.primary,
            context.config,
            token,
            context.request.jsonBody
          )
        )
      },
    }),
    defineExternalRoute("/storefront/customers/me/wishlist", {
      auth: "external",
      method: "POST",
      summary: "Toggle one wishlist item inside the authenticated storefront customer portal.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await toggleCustomerWishlistItem(
            context.databases.primary,
            context.config,
            token,
            context.request.jsonBody
          )
        )
      },
    }),
    defineExternalRoute("/storefront/customers/me/support-cases", {
      auth: "external",
      summary: "List the authenticated storefront customer's support cases.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await listCustomerSupportCases(
            context.databases.primary,
            context.config,
            token
          )
        )
      },
    }),
    defineExternalRoute("/storefront/customers/me/support-cases", {
      auth: "external",
      method: "POST",
      summary: "Create one support case from the authenticated storefront customer portal.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await createCustomerSupportCase(
            context.databases.primary,
            context.config,
            token,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineExternalRoute("/storefront/customers/me/order-requests", {
      auth: "external",
      summary: "List authenticated storefront customer return and cancellation requests.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await listCustomerOrderRequests(
            context.databases.primary,
            context.config,
            token,
            context.request.url.searchParams.get("orderId")
          )
        )
      },
    }),
    defineExternalRoute("/storefront/customers/me/order-requests", {
      auth: "external",
      method: "POST",
      summary: "Create an authenticated storefront customer return or cancellation request.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await createCustomerOrderRequest(
            context.databases.primary,
            context.config,
            token,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineExternalRoute("/storefront/checkout", {
      auth: "none",
      method: "POST",
      summary: "Create a storefront checkout order and return the Razorpay payment session.",
      handler: async (context) =>
        jsonResponse(
          await createCheckoutOrder(
            context.databases.primary,
            context.config,
            context.request.jsonBody,
            readBearerToken(context.request.headers)
          ),
          201
        ),
    }),
    defineExternalRoute("/storefront/checkout/payment/verify", {
      auth: "none",
      method: "POST",
      summary: "Verify a Razorpay payment and confirm the storefront order.",
      handler: async (context) =>
        jsonResponse(
          await verifyCheckoutPayment(
            context.databases.primary,
            context.config,
            context.request.jsonBody,
            readBearerToken(context.request.headers)
          )
        ),
    }),
    defineExternalRoute("/storefront/payments/razorpay/webhook", {
      auth: "none",
      method: "POST",
      summary: "Receive and verify Razorpay webhook events for storefront payments.",
      handler: async (context) =>
        jsonResponse(
          await handleRazorpayWebhook(context.databases.primary, context.config, {
            bodyText: context.request.bodyText,
            signature: readHeader(context.request.headers, "x-razorpay-signature") ?? null,
            providerEventId: readHeader(context.request.headers, "x-razorpay-event-id") ?? null,
          })
        ),
    }),
    defineExternalRoute("/storefront/payment-config", {
      auth: "none",
      summary: "Expose the storefront payment provider config required by the checkout UI.",
      handler: async (context) =>
        jsonResponse(getRazorpayPaymentConfig(context.config)),
    }),
    defineExternalRoute("/storefront/orders", {
      auth: "external",
      summary: "List the authenticated storefront customer's orders.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await listCustomerOrders(context.databases.primary, context.config, token)
        )
      },
    }),
    defineExternalRoute("/storefront/order", {
      auth: "external",
      summary: "Read one authenticated storefront order by id.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)
        const orderId = context.request.url.searchParams.get("id")

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        if (!orderId) {
          return jsonResponse({ error: "Order id is required." }, 400)
        }

        return jsonResponse(
          await getCustomerOrder(
            context.databases.primary,
            context.config,
            token,
            orderId
          )
        )
      },
    }),
    defineExternalRoute("/storefront/order-receipt", {
      auth: "external",
      summary: "Download one authenticated storefront order receipt as an attachment.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)
        const orderId = context.request.url.searchParams.get("id")

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        if (!orderId) {
          return jsonResponse({ error: "Order id is required." }, 400)
        }

        const document = await getCustomerOrderReceiptDocument(
          context.databases.primary,
          context.config,
          token,
          orderId
        )

        return htmlResponse(document.html, 200, document.fileName)
      },
    }),
  ]
}
