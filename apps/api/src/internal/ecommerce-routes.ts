import { listCustomerDetails, listCustomerSummaries } from "../../../ecommerce/src/services/customer-service.js"
import { listOrderSummaries, listOrderWorkflows } from "../../../ecommerce/src/services/order-service.js"
import { getStorefrontCatalog, listProducts } from "../../../ecommerce/src/services/product-service.js"
import { getEcommercePricingSettings } from "../../../ecommerce/src/services/settings-service.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { jsonResponse } from "../shared/http-responses.js"

export function createEcommerceInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/ecommerce/products", {
      legacyPaths: ["/internal/ecommerce/products"],
      summary: "Internal commerce catalog list for admin and merchandising surfaces.",
      handler: () => jsonResponse(listProducts()),
    }),
    defineInternalRoute("/ecommerce/storefront/catalog", {
      legacyPaths: ["/internal/ecommerce/storefront/catalog"],
      summary: "Internal storefront projection used by commerce preview surfaces.",
      handler: () => jsonResponse(getStorefrontCatalog()),
    }),
    defineInternalRoute("/ecommerce/orders", {
      legacyPaths: ["/internal/ecommerce/orders"],
      summary: "Commerce order summaries for operations views.",
      handler: () => jsonResponse(listOrderSummaries()),
    }),
    defineInternalRoute("/ecommerce/order-workflows", {
      legacyPaths: ["/internal/ecommerce/order-workflows"],
      summary: "Commerce order workflows with shipment and invoice state.",
      handler: () => jsonResponse(listOrderWorkflows()),
    }),
    defineInternalRoute("/ecommerce/customers", {
      legacyPaths: ["/internal/ecommerce/customers"],
      summary: "Commerce customer helpdesk summaries for support and retention views.",
      handler: () => jsonResponse(listCustomerSummaries()),
    }),
    defineInternalRoute("/ecommerce/customer-details", {
      legacyPaths: ["/internal/ecommerce/customer-details"],
      summary: "Commerce customer helpdesk detail records including issues and orders.",
      handler: () => jsonResponse(listCustomerDetails()),
    }),
    defineInternalRoute("/ecommerce/settings/pricing", {
      legacyPaths: ["/internal/ecommerce/settings/pricing"],
      summary: "Commerce pricing defaults used by catalog and operations tooling.",
      handler: () => jsonResponse(getEcommercePricingSettings()),
    }),
  ]
}
