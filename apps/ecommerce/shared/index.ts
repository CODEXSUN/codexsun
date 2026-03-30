import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const ecommerceAppWorkspace = defineAppWorkspace(
  "ecommerce",
  "Ecommerce"
)

export * from "./workspace-items.js"
export * from "./schemas/ecommerce.js"
export * from "./schemas/customer-profile.js"
export * from "./schemas/customer-helpdesk.js"
export * from "./schemas/product.js"
export * from "./schemas/storefront.js"
export * from "./schemas/commerce.js"
