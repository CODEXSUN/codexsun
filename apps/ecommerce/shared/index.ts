import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const ecommerceAppWorkspace = defineAppWorkspace("ecommerce", "Ecommerce")

export * from "./workspace-items.js"
export * from "./schemas/catalog.js"
export * from "./schemas/customer.js"
export * from "./schemas/order.js"
export * from "./storefront-seo.js"
